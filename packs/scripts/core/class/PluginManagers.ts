import { ShutdownEvent, StartupEvent, WorldLoadAfterEvent } from "npm:@minecraft/server@2.3.0";
import PluginSetting from "../types/PluginSetting.ts";

class PluginManager {
    private plugins: PluginSetting[] = [];
    private static instance: PluginManager;

    private constructor() { }

    static isEnabled(plugin: string): boolean {
        const pluginInstance = PluginManager.getInstance().getPluginByName(plugin);
        if (!pluginInstance) {
            throw new Error(`Plugin with name ${plugin} is not registered.`);
        }
        return pluginInstance.setting.enabled;
    }

    public static getInstance(): PluginManager {
        if (!PluginManager.instance) {
            PluginManager.instance = new PluginManager();
        }
        return PluginManager.instance;
    }

    public registerPlugin(plugin: PluginSetting): void {
        if (this.plugins.find(p => p.name === plugin.name)) {
            throw new Error(`Plugin with name ${plugin.name} is already registered.`);
        }
        this.plugins.push(plugin);
    }

    public registerPlugins(plugins: PluginSetting[]): void {
        plugins.forEach(plugin => this.registerPlugin(plugin));
    }

    public unregisterPlugin(pluginName: string): void {
        const index = this.plugins.findIndex(plugin => plugin.name === pluginName);
        if (index === -1) {
            throw new Error(`Plugin with name ${pluginName} is not registered.`);
        }
        this.plugins.splice(index, 1);
    }

    public getPlugins(): PluginSetting[] {
        return this.plugins;
    }

    public getPluginByName(name: string): PluginSetting | undefined {
        return this.plugins.find(plugin => plugin.name === name);
    }

    public loadPlugins(plugins: PluginSetting[], ev: WorldLoadAfterEvent): void {
        plugins.forEach(plugin => {
            if (!plugin.setting.enabled) return;
            plugin.main.onLoad(ev);
        });
    }

    public startupPlugins(plugins: PluginSetting[], ev: StartupEvent): void {
        plugins.forEach(plugin => {
            if (!plugin.setting.enabled) return;
            plugin.main.onStartup(ev);
        });
    }

    public shutdownPlugins(plugins: PluginSetting[], ev: ShutdownEvent): void {
        plugins.forEach(plugin => {
            if (!plugin.setting.enabled) return;
            plugin.main.onShutdown(ev);
        });
    }
}

export { PluginManager };
