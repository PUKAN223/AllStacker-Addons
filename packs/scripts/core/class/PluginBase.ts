import { Logger } from "./Logger.ts";
import { PluginLoader } from "../../kisux3/configs/PluginLoader.ts";
import { PageBuilder } from "./PageBuilders.ts";
import {
  Player,
  ShutdownEvent,
  StartupEvent,
  WorldLoadAfterEvent,
} from "@minecraft/server";

/**
 * Base class for all plugins in the AllStacker system.
 * Provides common functionality and lifecycle hooks for plugins.
 */
class PluginBase {
  /** The name of the plugin */
  public name: string;
  /** A brief description of what the plugin does */
  public description: string;
  /** The current version of the plugin */
  public version: string;
  /** Logger instance for this plugin */
  public logger: Logger;

  /**
   * Creates a new PluginBase instance.
   * @param name - The name of the plugin
   * @param description - A brief description of the plugin
   * @param version - The version string of the plugin
   */
  constructor(name: string, description: string, version: string) {
    this.name = name;
    this.description = description;
    this.version = version;
    this.logger = Logger.getInstance();
  }

  /**
   * Gets the configuration object for this plugin.
   * @returns The plugin's configuration record
   */
  public getConfig(): Record<string, unknown> {
    const plugin = PluginLoader.find((plugin) => plugin.name === this.name);
    if (!plugin) return {};
    return plugin.setting.config;
  }

  /**
   * Gets the name of this plugin.
   * @returns The plugin name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Lifecycle hook called when the plugin is first loaded.
   * Override this method to perform initialization logic.
   * @param _ev - Optional world load event
   */
  public onLoad(_ev?: WorldLoadAfterEvent): void {}

  /**
   * Lifecycle hook called during server startup.
   * Override this method to run startup logic.
   * @param _ev - The startup event
   */
  public onStartup(_ev: StartupEvent): void {}

  /**
   * Lifecycle hook called during server shutdown.
   * Override this method to perform cleanup logic.
   * @param _ev - The shutdown event
   */
  public onShutdown(_ev: ShutdownEvent): void {}

  /**
   * Adds configuration UI for this plugin.
   * Override this method to add custom settings UI.
   * @param _pl - The player to show the UI to
   * @param _page - The page builder for adding UI elements
   * @param _showUI - Whether to show the UI (default: true)
   * @returns True if UI was added, false otherwise
   */
  public addConfig(
    _pl: Player,
    _page: PageBuilder,
    _showUI: boolean = true,
  ): boolean {
    return false;
  }
}

export { PluginBase };
