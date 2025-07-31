import { PluginManager } from "./PluginManagers";
class KXEvents {
    static on(plugin, eventName, callback) {
        if (plugin === null) {
            // Global events use a special key
            const key = "__global__";
            if (!this.events.has(key)) {
                this.events.set(key, Object.create(null));
            }
            const pluginEvents = this.events.get(key);
            if (!pluginEvents[eventName]) {
                pluginEvents[eventName] = [];
            }
            pluginEvents[eventName].push(callback);
            return;
        }
        if (!PluginManager.isEnabled(plugin.getName()))
            return;
        const key = plugin.getName();
        if (!this.events.has(key)) {
            this.events.set(key, Object.create(null));
        }
        const pluginEvents = this.events.get(key);
        if (!pluginEvents[eventName]) {
            pluginEvents[eventName] = [];
        }
        pluginEvents[eventName].push(callback);
    }
    static emit(plugin, eventName, data) {
        if (plugin === null) {
            // Emit to global events and all plugin events
            const globalEvents = this.events.get("__global__");
            if (globalEvents) {
                const callbacks = globalEvents[eventName];
                if (callbacks) {
                    for (const cb of callbacks) {
                        try {
                            cb(data);
                        }
                        catch (err) {
                            console.error(`[KXEvents] Error in global event "${eventName}":`, err.stack);
                        }
                    }
                }
            }
            // Also emit to all enabled plugins
            for (const [key, pluginEvents] of this.events.entries()) {
                if (key === "__global__")
                    continue; // Skip global events, already handled
                // Check if plugin is enabled (skip if not)
                if (!PluginManager.isEnabled(key))
                    continue;
                const callbacks = pluginEvents[eventName];
                if (!callbacks)
                    continue;
                for (const cb of callbacks) {
                    try {
                        cb(data);
                    }
                    catch (err) {
                        console.error(`[KXEvents] Error in event "${eventName}" from ${key}:`, err.stack);
                    }
                }
            }
            return;
        }
        if (!PluginManager.isEnabled(plugin.getName()))
            return;
        const key = plugin.getName();
        const pluginEvents = this.events.get(key);
        if (!pluginEvents)
            return;
        const callbacks = pluginEvents[eventName];
        if (!callbacks)
            return;
        for (const cb of callbacks) {
            try {
                cb(data);
            }
            catch (err) {
                console.error(`[KXEvents] Error in event "${eventName}" from ${plugin.getName()}:`, err.stack);
            }
        }
    }
}
KXEvents.events = new Map();
export { KXEvents };
//# sourceMappingURL=EventEmitter.js.map