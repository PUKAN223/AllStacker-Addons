import {
  type ShutdownEvent,
  type StartupEvent,
  type System,
  system,
  type SystemAfterEvents,
  type SystemBeforeEvents,
  type World,
  world,
  type WorldAfterEvents,
  type WorldBeforeEvents,
} from "@minecraft/server";
import { ConfigManagers } from "./ConfigManagers.ts";
import { EventHandlers } from "./EventHanlders.ts";
import { Logger } from "./Logger.ts";
import { PluginManagers } from "./PluginManagers.ts";
import { SettingMenuBuilders } from "./SettingMenuBuilders.ts";
import type { SystemBaseOptions } from "../types/SystemBaseOptions.ts";
import type { WorldEvents } from "../types/WorldEvents.ts";
import { PlayerManagers } from "./PlayerManagers.ts";
import { SystemPlugin } from "../plugins/SystemPlugin/index.ts";
import { PlayerUtils } from "../global/Player.ts";
import { MinecraftColors } from "./MinecraftColors.ts";

type Awaitable<T> = T | Promise<T>;

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

  // Track subscribed handlers alongside their owning signal so we can unsubscribe with the same callback
  private eventSubscriptions = new Map<
    string,
    {
      signal: { unsubscribe: (cb: (arg: unknown) => void) => void };
      handler: (arg: unknown) => void;
    }
  >();
  private MCColors = (str: string) => new MinecraftColors(str);
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
    this.events.on("AfterItemUse", (ev) => {
      if (ev.itemStack.typeId !== this.options.settingItemType) return;
      this.settingMenuBuilders.settingMenu(ev.source, this.pluginManagers);
    });

    this.events.on("BeforeStartup", (ev) => {
      void this.onStartup(ev);
    });
    this.events.on("BeforeShutdown", (ev) => {
      void this.onShutdown(ev);
    });

    system.runInterval(() => {
      this.events.emit("AfterTick", { currentTick: system.currentTick });
    });
  }

  private setupDynamicEventMapping() {
    this.events.setSubscriptionHandlers(
      (event) => this.subscribeToEvent(event),
      (event) => {
        this.unsubscribeFromEvent(event);
      },
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
      const handler = (arg: unknown) => {
        this.events.emit(
          eventName as keyof WorldEvents,
          arg as WorldEvents[keyof WorldEvents],
        );
      };
      world.afterEvents[typedKey].subscribe(handler);
      this.eventSubscriptions.set(eventName, {
        signal: world.afterEvents[typedKey],
        handler,
      });
    } else if (!isAfter && lowerEventName in world.beforeEvents) {
      const typedKey = lowerEventName as keyof WorldBeforeEvents;
      const handler = (arg: unknown) => {
        this.events.emit(
          eventName as keyof WorldEvents,
          arg as WorldEvents[keyof WorldEvents],
        );
      };
      world.beforeEvents[typedKey].subscribe(handler);
      this.eventSubscriptions.set(eventName, {
        signal: world.beforeEvents[typedKey],
        handler,
      });
    } // Try system events
    else if (isAfter && lowerEventName in system.afterEvents) {
      const typedKey = lowerEventName as keyof SystemAfterEvents;
      const handler = (arg: unknown) => {
        this.events.emit(
          eventName as keyof WorldEvents,
          arg as WorldEvents[keyof WorldEvents],
        );
      };
      system.afterEvents[typedKey].subscribe(handler);
      this.eventSubscriptions.set(eventName, {
        signal: system.afterEvents[typedKey],
        handler,
      });
    } else if (!isAfter && lowerEventName in system.beforeEvents) {
      const typedKey = lowerEventName as keyof SystemBeforeEvents;
      const handler = (arg: unknown) => {
        this.events.emit(
          eventName as keyof WorldEvents,
          arg as WorldEvents[keyof WorldEvents],
        );
      };
      system.beforeEvents[typedKey].subscribe(handler);
      this.eventSubscriptions.set(eventName, {
        signal: system.beforeEvents[typedKey],
        handler,
      });
    }
  }

  private unsubscribeFromEvent(eventName: string) {
    const subscription = this.eventSubscriptions.get(eventName);
    if (!subscription) return;

    system.run(() => subscription.signal.unsubscribe(subscription.handler));
    this.eventSubscriptions.delete(eventName);
  }

  public onLoad(_ev: StartupEvent): Awaitable<void> {}

  private onStartup(ev: StartupEvent): void {
    try {
      const onLoadResult = this.onLoad(ev);
      if (onLoadResult instanceof Promise) {
        void onLoadResult.catch((error) => {
          this.logger.error(`Error during onLoad: ${error as Error}`);
        });
      }
    } catch (error) {
      this.logger.error(`Error during onLoad: ${error as Error}`);
    }
    this.pluginManagers.registerPlugin(SystemPlugin);
    const plugins = this.pluginManagers.getPlugins();
    const onEnableTasks = new Map<string, Promise<boolean>>();

    // Keep command registrations inside ModuleStartup (no async boundary here).
    for (const plugin of plugins) {
      try {
        const result = plugin.onEnable(ev);
        if (result instanceof Promise) {
          onEnableTasks.set(
            plugin.name,
            result.then(() => true).catch((error) => {
              this.logger.error(
                `Error during onEnable of plugin ${plugin.name}: ${error as Error}`,
              );
              return false;
            }),
          );
        } else {
          onEnableTasks.set(plugin.name, Promise.resolve(true));
        }
      } catch (error) {
        this.logger.error(
          `Error during onEnable of plugin ${plugin.name}: ${error as Error}`,
        );
        onEnableTasks.set(plugin.name, Promise.resolve(false));
      }
    }

    // Defer config-based loading to runtime tick to avoid early-execution API errors.
    system.run(() => {
      void this.loadPluginsRuntime(plugins, onEnableTasks);
    });
  }

  private async loadPluginsRuntime(
    plugins: ReturnType<PluginManagers["getPlugins"]>,
    onEnableTasks: Map<string, Promise<boolean>>,
  ): Promise<void> {
    const startupTasks: Promise<boolean>[] = [];
    for (const plugin of plugins) {
      startupTasks.push((async () => {
        try {
          await this.pluginManagers.applyPluginState(plugin);
          return plugin.isEnabled();
        } catch (error) {
          this.logger.error(
            `Error during startup of plugin ${plugin.name}: ${error as Error}`,
          );
          return false;
        }
      })());
    }

    const startupResults = await Promise.all(startupTasks);
    const enableResults = await Promise.all(
      plugins.map((plugin) =>
        onEnableTasks.get(plugin.name) ?? Promise.resolve(true)
      ),
    );
    let pluginLoadCount = 0;
    for (let i = 0; i < plugins.length; i++) {
      if (startupResults[i] && enableResults[i]) {
        pluginLoadCount++;
      }
    }

    const endTime = Date.now();
    const loadDuration = endTime - this.startTime;
    this.playerManagers.eachPlayer((pl) => {
      PlayerUtils.sendToast(
        pl,
        "",
        `${this.MCColors("Plugin Loaded").grey} (${
          this.MCColors(pluginLoadCount.toString()).green
        }/${this.MCColors(plugins.length.toString()).red}) ${
          this.MCColors(`in ${loadDuration}ms`).grey
        }`,
        "textures/items/compass_item",
        "textures/ui/greyBorder",
      );
    });
  }

  private async onShutdown(ev: ShutdownEvent): Promise<void> {
    const plugins = this.pluginManagers.getPlugins();
    for (const plugin of plugins) {
      if (!plugin.isEnabled()) continue;
      try {
        await plugin.onDisable(ev);
      } catch (error) {
        this.logger.error(
          `Error during onDisable of plugin ${plugin.name}: ${error as Error}`,
        );
      }
    }
  }
}

export { SystemBase };
