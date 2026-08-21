import {
  type ShutdownEvent,
  type StartupEvent,
  type System,
  type World,
  system,
  world,
  type Player
} from "@minecraft/server";
import type { Config } from  "@packages/api/src/class/ConfigManagers.ts";
import type { EventHandlers } from  "@packages/api/src/class/EventHanlders.ts";
import type { PluginSettingOptions } from  "@packages/api/src/types/PluginSettingOptions.ts";
import type { SystemBase } from  "@packages/api/src/class/SystemBase.ts";
import type { WorldEvents } from  "@packages/api/src/types/WorldEvents.ts";
import { Logger } from  "@packages/api/src/class/Logger.ts";
import { PluginEventHandlers } from  "@packages/api/src/class/PluginEventHanlders.ts";
import { SettingMenu } from  "@packages/api/src/class/SettingMenuBuilders.ts";
import { PlayerManagers } from  "@packages/api/src/class/PlayerManagers.ts";
import { ItemActionManager } from  "@packages/api/src/class/ItemActionManager.ts";
import { MinecraftColors } from  "@packages/api/src/class/MinecraftColors.ts";

type Awaitable<T> = T | Promise<T>;

class PluginBase {
  public isLoaded: boolean = false;
  public events: PluginEventHandlers;
  public name: string = "PluginBase";
  public version: string = "1.0.0";
  public icon: string = ""
  public world: World;
  public system: System;
  public systemBase: SystemBase;
  public settingMenu: SettingMenu;
  public playerManagers: PlayerManagers;
  public itemActionManager: ItemActionManager;
  public isRuntime: boolean = false;
  public mcColors = (str: string): MinecraftColors => new MinecraftColors(str);

  constructor(events: EventHandlers<WorldEvents>, systemBase: SystemBase) {
    this.events = new PluginEventHandlers(this, events);
    this.world = world;
    this.system = system;
    this.systemBase = systemBase;
    this.settingMenu = new SettingMenu(this, this.getPluginSettings(), undefined);
    this.playerManagers = new PlayerManagers();
    this.itemActionManager = new ItemActionManager(this);
  }

  get config(): Config<PluginSettingOptions> {
    return this.systemBase.configManager.getConfig(this.name)!;
  }

  get logger(): Logger {
    return new Logger(this.name.toUpperCase());
  }

  public async load(): Promise<void> {
    if (this.isLoaded) return;
    this.initializeConfig();
    await this.onLoad();
    this.isLoaded = true;
  }

  public getName(): string {
    return this.name;
  }

  public onEnable(_ev: StartupEvent): Awaitable<void> {
  }

  public onLoad(): Awaitable<void> {
  }

  public onDisable(_ev: ShutdownEvent): Awaitable<void> {
  }

  public isEnabled(): boolean {
    const config = this.config.get();
    const enabledSetting = (config as PluginSettingOptions | undefined)?.["Enabled"];
    const defaultEnabled = this.getPluginSettings().Enabled?.default ?? true;

    if (enabledSetting !== undefined && enabledSetting !== null) {
      if (typeof enabledSetting === "object") {
        if ("value" in enabledSetting) return Boolean(enabledSetting.value);
        if ("default" in enabledSetting) return Boolean(enabledSetting.default);
      } else {
        return Boolean(enabledSetting);
      }
    }

    return Boolean(defaultEnabled);
  }

  public registerSettings(menu: typeof SettingMenu): void {
    this.settingMenu = new menu(this, this.getPluginSettings(), undefined);
  }

  public getPluginSettings(): PluginSettingOptions {
    return {
      ["Enabled"]: {
        description: "Toggle this plugin on or off.",
        type: "boolean",
        default: true,
      },
      ...this.getSettings(),
    };
  }

  public getSettings(): PluginSettingOptions {
    return {};
  }

  public getAdvancedSettings(_pl: Player, _plugin: PluginBase, _onBack: () => void): (() => void) | null {
    return null;
  }

  /** Resets config to default values for all settings. */
  public resetConfig(): void {
    this.config.clear();
    this.initializeConfig();
    this.logger.info(`Config reset to defaults.`);
  }

  private initializeConfig() {
    let config = this.config.get();
    if (!config) {
      this.config.set({});
      config = this.config.get()!;
    }

    const pluginSettings = this.getPluginSettings();
    const configUnUsedKeys = Object.keys(config).filter(
      (key) => !(key in pluginSettings),
    );
    for (const key of configUnUsedKeys) {
      delete config[key];
    }

    for (const [key, setting] of Object.entries(pluginSettings)) {
      if (!(key in config) || config[key]?.type !== setting.type || config[key]?.description !== setting.description || config[key]?.default !== setting.default) {
        config[key] = { ...setting, value: config[key]?.value ?? setting.default };
      }
    }
    this.config.set(config);
  }
}

export { PluginBase };
