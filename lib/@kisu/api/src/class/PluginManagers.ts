import { WorldEvents, EventHandlers, PluginBase, SystemBase } from "@kisu/api";

class PluginManagers {
    private plugins: Map<string, PluginBase> = new Map();
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

        return true;
    }
}

export { PluginManagers };