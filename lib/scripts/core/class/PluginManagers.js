class PluginManager {
    constructor() {
        this.plugins = [];
    }
    static isEnabled(plugin) {
        const pluginInstance = PluginManager.getInstance().getPluginByName(plugin);
        if (!pluginInstance) {
            throw new Error(`Plugin with name ${plugin} is not registered.`);
        }
        return pluginInstance.setting.enabled;
    }
    static getInstance() {
        if (!PluginManager.instance) {
            PluginManager.instance = new PluginManager();
        }
        return PluginManager.instance;
    }
    registerPlugin(plugin) {
        if (this.plugins.find(p => p.name === plugin.name)) {
            throw new Error(`Plugin with name ${plugin.name} is already registered.`);
        }
        this.plugins.push(plugin);
    }
    registerPlugins(plugins) {
        plugins.forEach(plugin => this.registerPlugin(plugin));
    }
    unregisterPlugin(pluginName) {
        const index = this.plugins.findIndex(plugin => plugin.name === pluginName);
        if (index === -1) {
            throw new Error(`Plugin with name ${pluginName} is not registered.`);
        }
        this.plugins.splice(index, 1);
    }
    getPlugins() {
        return this.plugins;
    }
    getPluginByName(name) {
        return this.plugins.find(plugin => plugin.name === name);
    }
    loadPlugins(plugins, ev) {
        plugins.forEach(plugin => {
            if (!plugin.setting.enabled)
                return;
            plugin.main.onLoad(ev);
        });
    }
    startupPlugins(plugins, ev) {
        plugins.forEach(plugin => {
            if (!plugin.setting.enabled)
                return;
            plugin.main.onStartup(ev);
        });
    }
    shutdownPlugins(plugins, ev) {
        plugins.forEach(plugin => {
            if (!plugin.setting.enabled)
                return;
            plugin.main.onShutdown(ev);
        });
    }
}
export { PluginManager };
//# sourceMappingURL=PluginManagers.js.map