import {
  ShutdownEvent,
  StartupEvent,
  System,
  system,
  SystemAfterEvents,
  SystemBeforeEvents,
  World,
  world,
  WorldAfterEvents,
  WorldBeforeEvents,
} from "@minecraft/server";
import {
  ConfigManagers,
  EventHandlers,
  Logger,
  PluginManagers,
  SettingMenuBuilders,
  SystemBaseOptions,
  WorldEvents,
} from "@kisu/api";
import { PlayerManagers } from "./PlayerManagers.ts";

class SystemBase {
  public world: World;
  public system: System;
  public configManager: ConfigManagers;
  public events: EventHandlers<WorldEvents>;
  public pluginManagers: PluginManagers;
  public logger: Logger;
  public settingMenuBuilders: SettingMenuBuilders;
  public playerManagers: PlayerManagers;
  private options: SystemBaseOptions = {
    settingItemType: "minecraft:clock",
  };
  public isSettingEnabled: boolean = true;
  private eventSubscriptions = new Map<string, () => void>();
  private startTime: number = Date.now();

  constructor(options?: SystemBaseOptions) {
    this.world = world;
    this.system = system;
    this.events = new EventHandlers<WorldEvents>();
    this.logger = new Logger("SYSTEM");
    this.configManager = new ConfigManagers();
    this.pluginManagers = new PluginManagers(this.events, this);
    this.settingMenuBuilders = new SettingMenuBuilders();
    this.playerManagers = new PlayerManagers();
    if (options) {
      this.options = { ...this.options, ...options };
    }

    this.setupDynamicEventMapping();
    this.initializeEvents();
  }

  private initializeEvents() {
    if (this.isSettingEnabled) {
      this.events.on("AfterItemUse", (ev) => {
        if (ev.itemStack.typeId !== this.options.settingItemType) return;
        this.settingMenuBuilders.settingMenu(ev.source, this.pluginManagers);
      });
    }

    this.events.on("BeforeStartup", (ev) => this.onStartup(ev));
    this.events.on("BeforeShutdown", (ev) => this.onShutdown(ev));

    system.runInterval(() => {
      this.events.emit("AfterTick", { currentTick: system.currentTick });
    });
  }

  private setupDynamicEventMapping() {
    this.events.setSubscriptionHandlers(
      (event) => this.subscribeToEvent(event),
      (event) => this.unsubscribeFromEvent(event),
    );
  }

  private subscribeToEvent(eventName: string) {
    if (this.eventSubscriptions.has(eventName)) return;

    const isAfter = eventName.startsWith("After");
    const baseEventName = eventName.replace(/^(After|Before)/, "");
    const lowerEventName = baseEventName.charAt(0).toLowerCase() +
      baseEventName.slice(1);

    // Try world events first
    if (isAfter && lowerEventName in world.afterEvents) {
      const typedKey = lowerEventName as keyof WorldAfterEvents;
      const unsubscribe = world.afterEvents[typedKey].subscribe((arg) => {
        this.events.emit(eventName as keyof WorldEvents, arg);
      });
      this.eventSubscriptions.set(eventName, unsubscribe as () => void);
    } else if (!isAfter && lowerEventName in world.beforeEvents) {
      const typedKey = lowerEventName as keyof WorldBeforeEvents;
      const unsubscribe = world.beforeEvents[typedKey].subscribe((arg) => {
        this.events.emit(eventName as keyof WorldEvents, arg);
      });
      this.eventSubscriptions.set(eventName, unsubscribe as () => void);
    } // Try system events
    else if (isAfter && lowerEventName in system.afterEvents) {
      const typedKey = lowerEventName as keyof SystemAfterEvents;
      const unsubscribe = system.afterEvents[typedKey].subscribe((arg) => {
        this.events.emit(eventName as keyof WorldEvents, arg);
      });
      this.eventSubscriptions.set(eventName, unsubscribe as () => void);
    } else if (!isAfter && lowerEventName in system.beforeEvents) {
      const typedKey = lowerEventName as keyof SystemBeforeEvents;
      const unsubscribe = system.beforeEvents[typedKey].subscribe((arg) => {
        this.events.emit(eventName as keyof WorldEvents, arg);
      });
      this.eventSubscriptions.set(eventName, unsubscribe as () => void);
    }
  }

  private unsubscribeFromEvent(eventName: string) {
    const unsubscribe = this.eventSubscriptions.get(eventName);
    if (unsubscribe) {
      unsubscribe();
      this.eventSubscriptions.delete(eventName);
    }
  }

  public onLoad(ev: StartupEvent): void {
    ev;
  }

  private onStartup(ev: StartupEvent): void {
    this.onLoad(ev);

    const plugins = this.pluginManagers.getPlugins();
    let pluginLoadCount = 0;
    for (const plugin of plugins) {
      plugin.onEnable(ev);
      pluginLoadCount++;
    }

    system.run(() => {
      const endTime = Date.now();
      const loadDuration = endTime - this.startTime;
      console.warn(`Plugins loaded in ${loadDuration}ms`);
      // this.playerManagers.eachPlayer((pl) => {
      //   pl.sendToast(
      //     "",
      //     `${"Plugin Loaded".mcColors().grey} (${pluginLoadCount.toString().mcColors().green}/${plugins.length.toString().mcColors().red}) ${
      //       `in ${loadDuration}ms`.mcColors().grey
      //     }`,
      //     "textures/items/compass_item",
      //     "textures/ui/greyBorder",
      //   );
      // });
    });
  }

  private onShutdown(ev: ShutdownEvent): void {
    const plugins = this.pluginManagers.getPlugins();
    for (const plugin of plugins) {
      plugin.onDisable(ev);
    }
  }
}

export { SystemBase };
