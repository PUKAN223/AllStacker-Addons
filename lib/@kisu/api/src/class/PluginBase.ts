import {
  ShutdownEvent,
  StartupEvent,
  System,
  system,
  World,
  world,
  WorldLoadAfterEvent,
} from "npm:@minecraft/server@2.3.0";
import {
  Config,
  EventHandlers,
  Logger,
  PluginEventHandlers,
  PluginSettingOptions,
  SettingMenu,
  SystemBase,
  WorldEvents,
} from "@kisu/api";
import { PlayerManagers } from "./PlayerManagers.ts";
import { ItemActionManager } from "./ItemActionManager.ts";

class PluginBase {
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

  constructor(events: EventHandlers<WorldEvents>, systemBase: SystemBase) {
    this.events = new PluginEventHandlers(this, events);
    this.world = world;
    this.system = system;
    this.systemBase = systemBase;
    this.settingMenu = new SettingMenu(this, this.getSettings());
    this.playerManagers = new PlayerManagers();
    this.itemActionManager = new ItemActionManager(this);
    this.events.on("AfterWorldLoad", (ev) => {
      this.initializeConfig();
      this.onLoad(ev);
    });
  }

  get config(): Config<PluginSettingOptions> {
    return this.systemBase.configManager.getConfig(this.name)!;
  }

  get logger() {
    return new Logger(this.name.toUpperCase());
  }

  public getName(): string {
    return this.name;
  }

  public onEnable(ev: StartupEvent): void {
    ev;
  }

  public onLoad(ev: WorldLoadAfterEvent): void {
    ev;
  }

  public onDisable(ev: ShutdownEvent): void {
    ev;
  }

  public isEnabled(): boolean {
    return true;
  }

  public registerSettings(menu: typeof SettingMenu): void {
    this.settingMenu = new menu(this, this.getSettings());
  }

  public getSettings(): PluginSettingOptions {
    return {};
  }

  private initializeConfig() {
    let config = this.config.get();
    if (!config) {
      this.config.set({});
      config = this.config.get()!;
    }

    const configUnUsedKeys = Object.keys(config).filter(
      (key) => !(key in this.getSettings()),
    );
    for (const key of configUnUsedKeys) {
      delete config[key];
    }

    for (const [key, setting] of Object.entries(this.getSettings())) {
      if (!(key in config) || config[key].type !== setting.type || config[key].description !== setting.description || config[key].default !== setting.default) {
        config[key] = { ...setting, value: config[key]?.value ?? setting.default };
      }
    }
    this.config.set(config);
  }
}

export { PluginBase };
