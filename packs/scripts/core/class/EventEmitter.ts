import { SystemAfterEvents, SystemBeforeEvents, WorldAfterEvents, WorldBeforeEvents } from "npm:@minecraft/server@2.3.0";
import { PluginBase } from "./PluginBase.ts";
import { PluginManager } from "./PluginManagers.ts";

type AfterEventKeys = keyof WorldAfterEvents;
type BeforeEventKeys = keyof WorldBeforeEvents;
type SystemBeforeEventKeys = keyof SystemBeforeEvents;
type SystemAfterEventKeys = keyof SystemAfterEvents;

type PrefixedAfterKeys = `after:${AfterEventKeys}`;
type PrefixedBeforeKeys = `before:${BeforeEventKeys}`;
type PrefixedSystemBeforeKeys = `before:${SystemBeforeEventKeys}`;
type PrefixedSystemAfterKeys = `after:${SystemAfterEventKeys}`;

type AnyEventKey = PrefixedAfterKeys | PrefixedBeforeKeys | PrefixedSystemAfterKeys | PrefixedSystemBeforeKeys | `after:tick` | `custom:${string}`;

type EventCallbackMap = {
    [K in PrefixedBeforeKeys]: K extends `before:${infer N}`
    ? N extends BeforeEventKeys
    ? Parameters<WorldBeforeEvents[N]["subscribe"]>[0]
    : never
    : never;
} & {
    [K in PrefixedAfterKeys]: K extends `after:${infer N}`
    ? N extends AfterEventKeys
    ? Parameters<WorldAfterEvents[N]["subscribe"]>[0]
    : never
    : never;
} & {
    [K in PrefixedSystemBeforeKeys]: K extends `before:${infer N}`
    ? N extends SystemBeforeEventKeys
    ? Parameters<SystemBeforeEvents[N]["subscribe"]>[0]
    : never
    : never;
} & {
    [K in PrefixedSystemAfterKeys]: K extends `after:${infer N}`
    ? N extends SystemAfterEventKeys
    ? Parameters<SystemAfterEvents[N]["subscribe"]>[0]
    : never
    : never;
} & {
    [K in `after:tick`]: (ev: { currentTick: number }) => void;
} & {
    // deno-lint-ignore no-explicit-any
    [K in `custom:${string}`]: (ev: any) => void;
};

type EventCallback<K extends keyof EventCallbackMap> = EventCallbackMap[K];

type EventMap = {
    [K in AnyEventKey]: EventCallback<K>[];
} & {
    // deno-lint-ignore no-explicit-any
    [key: string]: EventCallback<any>[];
};

class KXEvents {
    private static events: Map<string, EventMap> = new Map();

    static on<T extends AnyEventKey>(
        plugin: PluginBase | null,
        eventName: T,
        callback: EventCallback<T>
    ) {
        if (plugin === null) {
            // Global events use a special key
            const key = "__global__";
            if (!this.events.has(key)) {
                this.events.set(key, Object.create(null) as EventMap);
            }
            const pluginEvents = this.events.get(key)!;
            if (!pluginEvents[eventName]) {
                pluginEvents[eventName] = [];
            }
            pluginEvents[eventName].push(callback as EventCallback<T>);
            return;
        }
        if (!PluginManager.isEnabled(plugin.getName())) return;
        const key = plugin.getName();
        if (!this.events.has(key)) {
            this.events.set(key, Object.create(null) as EventMap);
        }
        const pluginEvents = this.events.get(key)!;
        if (!pluginEvents[eventName]) {
            pluginEvents[eventName] = [];
        }
        pluginEvents[eventName].push(callback as EventCallback<T>);
    }
    // deno-lint-ignore no-explicit-any
    static emit<T = any>(plugin: PluginBase | null, eventName: string, data?: T) {
        if (plugin === null) {
            // Emit to global events and all plugin events
            const globalEvents = this.events.get("__global__");
            if (globalEvents) {
                const callbacks = globalEvents[eventName];
                if (callbacks) {
                    for (const cb of callbacks) {
                        try {
                            cb(data as T);
                        } catch (err) {
                            console.error(`[KXEvents] Error in global event "${eventName}":`, (err as Error).stack);
                        }
                    }
                }
            }

            // Also emit to all enabled plugins
            for (const [key, pluginEvents] of this.events.entries()) {
                if (key === "__global__") continue; // Skip global events, already handled

                // Check if plugin is enabled (skip if not)
                if (!PluginManager.isEnabled(key)) continue;

                const callbacks = pluginEvents[eventName];
                if (!callbacks) continue;
                for (const cb of callbacks) {
                    try {
                        cb(data as T);
                    } catch (err) {
                        console.error(`[KXEvents] Error in event "${eventName}" from ${key}:`, (err as Error).stack);
                    }
                }
            }
            return;
        }
        if (!PluginManager.isEnabled(plugin.getName())) return;
        const key = plugin.getName();
        const pluginEvents = this.events.get(key);
        if (!pluginEvents) return;
        const callbacks = pluginEvents[eventName];
        if (!callbacks) return;
        for (const cb of callbacks) {
            try {
                cb(data as T);
            } catch (err) {
                console.error(`[KXEvents] Error in event "${eventName}" from ${plugin.getName()}:`, (err as Error).stack);
            }
        }
    }
}

export { KXEvents };