import type { EventHandlers } from "./EventHanlders.ts";
import type { PluginBase } from "./PluginBase.ts";
import type { SystemBase } from "./SystemBase.ts";
import type { WorldEvents } from "../types/WorldEvents.ts";

class PluginManagers {
    private plugins: Map<string, PluginBase> = new Map();
    private pausedListeners: Map<string, Map<string, ((payload: unknown) => void)[]>> = new Map();
    private eventHandlers: EventHandlers<WorldEvents>;
    private SystemBase: SystemBase;

    constructor(event: EventHandlers<WorldEvents>, system: SystemBase) {
        this.eventHandlers = event;
        this.SystemBase = system;
    }

    public registerPlugin(...plugin: typeof PluginBase[]): void {
        for (const p of plugin) {
            const instance = new p(this.eventHandlers, this.SystemBase);
            this.plugins.set(instance.name, instance);
        }
    }

    public getPlugin(name: string): PluginBase | null {
        return this.plugins.get(name) || null;
    }

    public getPlugins(): PluginBase[] {
        return Array.from(this.plugins.values());
    }

    public isEnabled(name: string): boolean {
        const plugin = this.plugins.get(name);
        if (!plugin) return false;

        return plugin.isEnabled();
    }

    public async applyPluginState(plugin: PluginBase): Promise<void> {
        if (plugin.isEnabled()) {
            await this.enablePlugin(plugin);
            return;
        }

        this.disablePlugin(plugin);
    }

    public async setPluginEnabled(name: string, enabled: boolean): Promise<void> {
        const plugin = this.plugins.get(name);
        if (!plugin) return;

        const config = plugin.config.get() ?? {};
        const settings = plugin.getPluginSettings();
        if (!settings.Enabled) return;
        config.Enabled = { ...settings.Enabled, value: enabled };
        plugin.config.set(config);

        await this.applyPluginState(plugin);
    }

    private disablePlugin(plugin: PluginBase): void {
        if (!plugin.isLoaded) return;
        if (this.pausedListeners.has(plugin.name)) return;

        const paused = this.eventHandlers.suspendPlugin(plugin);
        this.pausedListeners.set(plugin.name, paused);
    }

    private async enablePlugin(plugin: PluginBase): Promise<void> {
        if (!plugin.isLoaded) {
            await plugin.load();
        }

        const paused = this.pausedListeners.get(plugin.name);
        if (!paused) {
            return;
        }

        this.eventHandlers.resumePlugin(plugin, paused);
        this.pausedListeners.delete(plugin.name);
    }
}

export { PluginManagers };
