import {
  ShutdownEvent,
  StartupEvent,
  WorldLoadAfterEvent,
} from "@minecraft/server";
import PluginSetting from "../types/PluginSetting.ts";

/**
 * Singleton manager for plugin registration and lifecycle control.
 * Handles plugin enable/disable state and tracks all loaded plugins.
 */
class PluginManager {
  private plugins: PluginSetting[] = [];
  private static instance: PluginManager;

  private constructor() {}

  /**
   * Gets the singleton instance of PluginManager.
   * @returns The PluginManager instance
   */
  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * Checks if a plugin is currently enabled.
   * @param plugin - The name of the plugin to check
   * @returns True if the plugin is enabled
   * @throws Error if plugin is not registered
   */
  static isEnabled(plugin: string): boolean {
    const pluginInstance = PluginManager.getInstance().getPluginByName(plugin);
    if (!pluginInstance) {
      throw new Error(`Plugin with name ${plugin} is not registered.`);
    }
    return pluginInstance.setting.enabled;
  }

  /**
   * Registers a single plugin with the manager.
   * @param plugin - The plugin setting to register
   * @throws Error if a plugin with the same name already exists
   */
  public registerPlugin(plugin: PluginSetting): void {
    if (this.plugins.find((p) => p.name === plugin.name)) {
      throw new Error(`Plugin with name ${plugin.name} is already registered.`);
    }
    this.plugins.push(plugin);
  }

  /**
   * Registers multiple plugins at once.
   * @param plugins - Array of plugin settings to register
   */
  public registerPlugins(plugins: PluginSetting[]): void {
    plugins.forEach((plugin) => this.registerPlugin(plugin));
  }

  /**
   * Unregisters a plugin by name.
   * @param pluginName - The name of the plugin to unregister
   * @throws Error if plugin is not found
   */
  public unregisterPlugin(pluginName: string): void {
    const index = this.plugins.findIndex((plugin) =>
      plugin.name === pluginName
    );
    if (index === -1) {
      throw new Error(`Plugin with name ${pluginName} is not registered.`);
    }
    this.plugins.splice(index, 1);
  }

  /**
   * Gets all registered plugins.
   * @returns Array of all plugin settings
   */
  public getPlugins(): PluginSetting[] {
    return this.plugins;
  }

  /**
   * Gets a specific plugin by name.
   * @param name - The name of the plugin to find
   * @returns The plugin setting or undefined if not found
   */
  public getPluginByName(name: string): PluginSetting | undefined {
    return this.plugins.find((plugin) => plugin.name === name);
  }

  /**
   * Loads all enabled plugins by calling their onLoad method.
   * @param plugins - Array of plugins to load
   * @param ev - The world load event
   */
  public loadPlugins(plugins: PluginSetting[], ev: WorldLoadAfterEvent): void {
    plugins.forEach((plugin) => {
      if (!plugin.setting.enabled) return;
      plugin.main.onLoad(ev);
    });
  }

  /**
   * Calls onStartup for all enabled plugins.
   * @param plugins - Array of plugins to start
   * @param ev - The startup event
   */
  public startupPlugins(plugins: PluginSetting[], ev: StartupEvent): void {
    plugins.forEach((plugin) => {
      if (!plugin.setting.enabled) return;
      plugin.main.onStartup(ev);
    });
  }

  /**
   * Calls onShutdown for all enabled plugins.
   * @param plugins - Array of plugins to shut down
   * @param ev - The shutdown event
   */
  public shutdownPlugins(plugins: PluginSetting[], ev: ShutdownEvent): void {
    plugins.forEach((plugin) => {
      if (!plugin.setting.enabled) return;
      plugin.main.onShutdown(ev);
    });
  }
}

export { PluginManager };
