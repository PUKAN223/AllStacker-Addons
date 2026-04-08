import {
  ItemComponentUseEvent,
  ItemStack,
  Player,
  PlayerPermissionLevel,
  StartupEvent,
  system,
  world,
  WorldLoadAfterEvent,
} from "@minecraft/server";
import {
  JsonDatabase,
  KXEvents,
  PageBuilder,
  PluginBase,
} from "../../../core/index.ts";
import IActionForm from "../../../core/class/forms/IActionForm.ts";
import { PluginLoader } from "../../configs/PluginLoader.ts";
import { LanguageContext } from "../../configs/Lang.ts";

class ConfigMenu extends PluginBase {
  private config: {
    PluginEnabled: JsonDatabase;
    LoadedConfig: boolean;
  } = {} as { PluginEnabled: JsonDatabase; LoadedConfig: boolean };

  static setEnabled(pluginName: string, enabled: boolean): void {
    const plugin = PluginLoader.find((p) => p.name === pluginName);
    if (plugin) {
      plugin.setting.enabled = enabled;
      const configLoadder = PluginLoader.find((p) => p.setting.config?.Loadder);
      if (!configLoadder) {
        console.warn(`ConfigMenu: Loadder plugin not found for ${pluginName}`);
        return;
      }
      const config = configLoadder.main.getConfig() as {
        PluginEnabled: JsonDatabase;
        LoadedConfig: boolean;
      };
      if (config && config.PluginEnabled) {
        config.PluginEnabled.set(pluginName, enabled);
        const isLoadded = PluginLoader.find((p) =>
          p.name === pluginName
        )!.setting.config.isLoadded;
        if (!isLoadded) {
          PluginLoader.find((p) => p.name === pluginName)!.setting.config
            .isLoadded = true;
          PluginLoader.find((p) => p.name === pluginName)!.main.onLoad();
        }
      }
    }
  }

  public showConfig(pl: Player): boolean {
    const pluginSettingList = PluginLoader.filter((plugin) =>
      plugin.name !== this.name
    );
    const configPage = new PageBuilder("configMenu");

    const pluginListPage = new IActionForm(
      `${LanguageContext.getTranslation("allstacker.title.configmenu", pl)}`,
      `${LanguageContext.getTranslation("allstacker.body.configmenu", pl)}`,
    );
    pluginListPage.addButton(
      `${LanguageContext.getTranslation("allstacker.button.language", pl)}`,
      "textures/ui/world_glyph_color_2x_black_outline",
      () => {
        const langPage = new IActionForm(
          `${LanguageContext.getTranslation("allstacker.title.language", pl)}`,
          `${LanguageContext.getTranslation("allstacker.body.language", pl)}`,
        );
        langPage.addDivider();
        langPage.addButton(
          "§cEnglish §8[ENG]§r",
          "textures/kisux3/ENG_Lang",
          () => {
            world.sendMessage(
              LanguageContext.getTranslation(
                "allstacker.message.language.set.english",
                pl,
              ),
            );
            LanguageContext.setPlayerLanguage(pl, "en");
          },
        );
        langPage.addButton("§2ไทย §8[TH]§r", "textures/kisux3/TH_Lang", () => {
          world.sendMessage(
            LanguageContext.getTranslation(
              "allstacker.message.language.set.thai",
              pl,
            ),
          );
          LanguageContext.setPlayerLanguage(pl, "th");
        });

        langPage.addDivider();
        langPage.addButton(
          `${LanguageContext.getTranslation("allstacker.button.back", pl)}`,
          "",
          () => {
            configPage.showPage(pl, "plugin-settings");
          },
        );
        configPage.addPage("language-settings", langPage);
        configPage.showPage(pl, "language-settings");
      },
    );

    pluginListPage.addDivider();
    pluginListPage.addLabel(
      `${
        LanguageContext.getTranslation("allstacker.label.plugin.list", pl)
      } §7(§c${pluginSettingList.length}§7)§r`,
    );
    pluginSettingList.forEach((plugin) => {
      const isHasConfig = plugin.main.addConfig(pl, configPage, false);
      if (isHasConfig) {
        const pluginIcon = plugin.setting.config?.PluginIcon ||
          "textures/ui/icon_book_writable";
        pluginListPage.addButton(
          plugin.name +
            `\n[${
              plugin.setting.enabled
                ? `${
                  LanguageContext.getTranslation(
                    "allstacker.label.plugin.enabled",
                    pl,
                  )
                }`
                : `${
                  LanguageContext.getTranslation(
                    "allstacker.label.plugin.disabled",
                    pl,
                  )
                }`
            }]`,
          pluginIcon as string,
          () => {
            plugin.main.addConfig(pl, configPage, true);
            configPage.showPage(pl, plugin.name);
          },
        );
      }
    });
    pluginListPage.addDivider();
    pluginListPage.addLabel(`Developer`);
    pluginListPage.addButton(
      "§8Debug Data",
      "textures/ui/Add-Ons_Side-Nav_Icon_24x24",
      () => {
        this.showDebugData(pl);
      },
    );

    configPage.addPage("plugin-settings", pluginListPage);
    configPage.showPage(pl, "plugin-settings");
    return true;
  }

  public override onLoad(_ev: WorldLoadAfterEvent): void {
    this.config = this.getConfig() as {
      PluginEnabled: JsonDatabase;
      LoadedConfig: boolean;
    };
    this.config.PluginEnabled = new JsonDatabase("PluginEnabled", world);
    const pluginText: string[] = [];
    PluginLoader.forEach((plugin) => {
      const pluginName = plugin.name;
      if (!this.config.PluginEnabled.has(pluginName)) {
        this.config.PluginEnabled.set(pluginName, true);
        plugin.setting.enabled = true;
      } else {
        const isEnabled = this.config.PluginEnabled.get(pluginName);
        this.config.PluginEnabled.set(pluginName, isEnabled);
        plugin.setting.enabled = isEnabled;
      }
      pluginText.push(
        `${pluginName}: ${plugin.setting.enabled ? "§aEnabled" : "§cDisabled"}`,
      );
    });

    const i = system.runInterval(() => {
      const players = world.getPlayers();
      if (players.length > 0) {
        system.clearRun(i);
        pluginText.forEach((text) => {
          world.sendMessage(`§7[All Stacker] §r${text}`);
        });
      }
    });
    this.config.LoadedConfig = true;
  }

  public override onStartup(ev: StartupEvent): void {
    KXEvents.on(this, "after:playerSpawn", (ev) => {
      if (!ev.initialSpawn) return;
      const isFirstJoin = !ev.player.getTags().includes("kisu:joined_before");
      if (isFirstJoin) {
        ev.player.addTag("kisu:joined_before");
        this.giveConfigMenu(ev.player);
      }
    });
    const showConfig = this.showConfig.bind(this);
    ev.itemComponentRegistry.registerCustomComponent("kisu:show_config", {
      onUse(ev: ItemComponentUseEvent): void {
        if (
          ev.source.playerPermissionLevel === PlayerPermissionLevel.Operator
        ) {
          showConfig(ev.source);
        } else {
          ev.source.onScreenDisplay.setActionBar(
            `${
              LanguageContext.getTranslation(
                "allstacker.text.wantOP",
                ev.source,
              )
            }`,
          );
        }
      },
    });
  }

  public giveConfigMenu(pl: Player): void {
    const containers = pl.getComponent("inventory")!;
    const configMenuItem = new ItemStack("kisu:ac_setting", 1);
    if (containers.container.emptySlotsCount > 0) {
      containers.container.addItem(configMenuItem);
    } else {
      pl.dimension.spawnItem(configMenuItem, pl.location);
    }
  }

  private showDebugData(pl: Player): void {
    const debugPage = new IActionForm(
      "Debug Data Analysis",
      "View internal data for troubleshooting and analysis",
    );
    debugPage.addDivider();

    debugPage.addButton(
      "§8Item Stacker Data",
      "",
      () => {
        this.showItemStackerDebug(pl);
      },
    );

    debugPage.addButton(
      "§8Mob Stacker Data",
      "",
      () => {
        this.showMobStackerDebug(pl);
      },
    );
    debugPage.addButton(
      "§8Config Usage",
      "textures/ui/advanced_glyph_color",
      () => {
        this.showMemoryUsage(pl);
      },
    );

    debugPage.addDivider();
    debugPage.addButton(
      `${LanguageContext.getTranslation("allstacker.button.back", pl)}`,
      "",
      () => {
        this.showConfig(pl);
      },
    );

    const debugPageBuilder = new PageBuilder("debugData");
    debugPageBuilder.addPage("debug_main", debugPage);
    debugPageBuilder.showPage(pl, "debug_main");
  }

  private showItemStackerDebug(pl: Player): void {
    const itemStacker = PluginLoader.find((p) => p.name === "Item Stackers");
    if (!itemStacker) {
      return;
    }

    const config = itemStacker.setting.config as Record<string, unknown>;
    const ItemListStack = config.ItemListStack as Set<unknown>;
    const ItemStackData = config.ItemStackData as JsonDatabase;
    const ItemStackConfig = config.ItemStackConfig as JsonDatabase;

    const debugInfo = [
      "§e> §bItem Stacker Debug§r\n",
      `§8Items in tracking list: §f${ItemListStack?.size ?? 0}`,
      `§8Items in database: §f${ItemStackData?.size ?? 0}`,
      `§8Fast Mode: §f${ItemStackConfig?.get("FastModeStacking") ?? false}`,
      `§8Radius Combine: §f${ItemStackConfig?.get("RadiusCombine") ?? 15}`,
      `§8Radius Seeing: §f${ItemStackConfig?.get("RadiusSeeing") ?? 10}`,
      `§8Unstack Items: §f${
        (ItemStackConfig?.get("UnStackItem") as string[])?.length ?? 0
      }`,
    ];

    const page = new IActionForm(
      "Item Stacker Debug",
      "Current internal data",
    );
    page.addDivider();
    // debugInfo.forEach((line) => {
    //   page.addLabel(line);
    // });
    page.addLabel(debugInfo.join("\n"));
    page.addDivider();
    page.addButton(
      `${LanguageContext.getTranslation("allstacker.button.back", pl)}`,
      "",
      () => {
        this.showDebugData(pl);
      },
    );

    const pageBuilder = new PageBuilder("debugItem");
    pageBuilder.addPage("item_debug", page);
    pageBuilder.showPage(pl, "item_debug");
  }

  private showMobStackerDebug(pl: Player): void {
    const mobStacker = PluginLoader.find((p) => p.name === "Mob Stacker");
    if (!mobStacker) {
      return;
    }

    const config = mobStacker.setting.config as Record<string, unknown>;
    const ResetEntities = config.ResetEntities as Set<unknown>;
    const MobStackConfig = config.MobStackConfig as JsonDatabase;
    const Xp_Queue = config.Xp_Queue as Map<string, number>;

    const debugInfo = [
      "§e> §bMob Stacker Debug§r\n",
      `§8Reset entities set: §f${ResetEntities?.size ?? 0}`,
      `§8XP Queue size: §f${Xp_Queue?.size ?? 0}`,
      `§8Radius Stacking: §f${MobStackConfig?.get("RadiusStacking") ?? 10}`,
      `§8Mob Death Mode: §f${MobStackConfig?.get("MobDeathMode") ?? "All"}`,
      `§8Stacked Mobs: §f${
        (MobStackConfig?.get("StackMob") as string[])?.length ?? 0
      }`,
    ];

    const page = new IActionForm(
      "Mob Stacker Debug",
      "Current internal data",
    );
    page.addDivider();
    page.addLabel(debugInfo.join("\n"));
    page.addDivider();
    page.addButton(
      `${LanguageContext.getTranslation("allstacker.button.back", pl)}`,
      "",
      () => {
        this.showDebugData(pl);
      },
    );

    const pageBuilder = new PageBuilder("debugMob");
    pageBuilder.addPage("mob_debug", page);
    pageBuilder.showPage(pl, "mob_debug");
  }

  private showMemoryUsage(pl: Player): void {
    const itemStacker = PluginLoader.find((p) => p.name === "Item Stackers");
    const mobStacker = PluginLoader.find((p) => p.name === "Mob Stacker");

    let totalItems = 0;
    let totalMobs = 0;

    if (itemStacker) {
      const config = itemStacker.setting.config as Record<string, unknown>;
      const ItemListStack = config.ItemListStack as Set<unknown>;
      const ItemStackData = config.ItemStackData as JsonDatabase;
      totalItems = (ItemListStack?.size ?? 0) + (ItemStackData?.size ?? 0);
    }

    if (mobStacker) {
      const config = mobStacker.setting.config as Record<string, unknown>;
      const ResetEntities = config.ResetEntities as Set<unknown>;
      const Xp_Queue = config.Xp_Queue as Map<string, number>;
      totalMobs = (ResetEntities?.size ?? 0) + (Xp_Queue?.size ?? 0);
    }

    const debugInfo = [
      "§e> Config Usage\n",
      `§8Total Tracked Items: §f${totalItems}`,
      `§8Total Tracked Mobs: §f${totalMobs}`,
      `§8Total Entities: §f${totalItems + totalMobs}`,
    ];

    const page = new IActionForm(
      "Config Usage",
      "Approximate entity tracking count",
    );
    page.addDivider();
    page.addLabel(debugInfo.join("\n"));
    page.addDivider();
    page.addButton(
      `${LanguageContext.getTranslation("allstacker.button.back", pl)}`,
      "",
      () => {
        this.showDebugData(pl);
      },
    );

    const pageBuilder = new PageBuilder("debugMemory");
    pageBuilder.addPage("memory_usage", page);
    pageBuilder.showPage(pl, "memory_usage");
  }
}

export default ConfigMenu;
