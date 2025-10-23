import { CustomComponentParameters, ItemComponentUseEvent, ItemCustomComponent, ItemCustomComponentInstance, ItemStack, Player, ShutdownEvent, StartupEvent, system, world, WorldLoadAfterEvent } from "@minecraft/server";
import { JsonDatabase, KXEvents, PageBuilder, PluginBase } from "../../../core";
import IActionForm from "../../../core/class/forms/IActionForm";
import { PluginLoader } from "../../configs/PluginLoader";
import { LanguageContext } from "../../configs/Lang";

class ConfigMenu extends PluginBase {
  private config: {
    PluginEnabled: JsonDatabase
    LoadedConfig: boolean
  } = {} as { PluginEnabled: JsonDatabase, LoadedConfig: boolean };

  static setEnabled(pluginName: string, enabled: boolean): void {
    const plugin = PluginLoader.find(p => p.name === pluginName);
    if (plugin) {
      plugin.setting.enabled = enabled;
      const configLoadder = PluginLoader.find(p => p.setting.config?.Loadder);
      if (!configLoadder) {
        console.warn(`ConfigMenu: Loadder plugin not found for ${pluginName}`);
        return;
      }
      const config = configLoadder.main.getConfig() as {
        PluginEnabled: JsonDatabase,
        LoadedConfig: boolean
      };
      if (config && config.PluginEnabled) {
        config.PluginEnabled.set(pluginName, enabled);
        const isLoadded = PluginLoader.find(p => p.name === pluginName).setting.config.isLoadded;
        if (!isLoadded) {
          PluginLoader.find(p => p.name === pluginName).setting.config.isLoadded = true;
          PluginLoader.find(p => p.name === pluginName).main.onLoad();
        }
      }
    }
  }

  public showConfig(pl: Player): boolean {
    const pluginSettingList = PluginLoader.filter(plugin => plugin.name !== this.name);
    const configPage = new PageBuilder("configMenu");

    const pluginListPage = new IActionForm(`${LanguageContext.getTranslation("allstacker.title.configmenu", pl)}`, `${LanguageContext.getTranslation("allstacker.body.configmenu", pl)}`);
    pluginListPage.addButton(`${LanguageContext.getTranslation("allstacker.button.language", pl)}`, "textures/ui/world_glyph_color_2x_black_outline", () => {
      const langPage = new IActionForm(`${LanguageContext.getTranslation("allstacker.title.language", pl)}`, `${LanguageContext.getTranslation("allstacker.body.language", pl)}`);
      langPage.addDivider()
      langPage.addButton("§cEnglish §8[ENG]§r", "textures/kisux3/ENG_Lang", () => {
        world.sendMessage(LanguageContext.getTranslation("allstacker.message.language.set.english", pl));
        LanguageContext.setPlayerLanguage(pl, "en");
      });
      langPage.addButton("§2ไทย §8[TH]§r", "textures/kisux3/TH_Lang", () => {
        world.sendMessage(LanguageContext.getTranslation("allstacker.message.language.set.thai", pl));
        LanguageContext.setPlayerLanguage(pl, "th");
      });

      langPage.addDivider();
      langPage.addButton(`${LanguageContext.getTranslation("allstacker.button.back", pl)}`, "", () => {
        configPage.showPage(pl, "plugin-settings");
      });
      configPage.addPage("language-settings", langPage);
      configPage.showPage(pl, "language-settings");
    })
    pluginListPage.addDivider()
    pluginListPage.addLabel(`${LanguageContext.getTranslation("allstacker.label.plugin.list", pl)} §7(§c${pluginSettingList.length}§7)§r`);
    pluginSettingList.forEach((plugin) => {
      const isHasConfig = plugin.main.addConfig(pl, configPage, false);
      if (isHasConfig) {
        const pluginIcon = plugin.setting.config?.PluginIcon || "textures/ui/icon_book_writable";
        pluginListPage.addButton(plugin.name + `\n[${plugin.setting.enabled ? `${LanguageContext.getTranslation("allstacker.label.plugin.enabled", pl)}` : `${LanguageContext.getTranslation("allstacker.label.plugin.disabled", pl)}`}]`, pluginIcon, () => {
          plugin.main.addConfig(pl, configPage, true);
          configPage.showPage(pl, plugin.name);
        });
      }
    })

    configPage.addPage("plugin-settings", pluginListPage);
    configPage.showPage(pl, "plugin-settings");
    return true;
  }

  public onLoad(ev: WorldLoadAfterEvent): void {
    this.config = this.getConfig() as {
      PluginEnabled: JsonDatabase,
      LoadedConfig: boolean
    };
    this.config.PluginEnabled = new JsonDatabase("PluginEnabled", world);
    const pluginText: string[] = []
    PluginLoader.forEach(plugin => {
      const pluginName = plugin.name;
      if (!this.config.PluginEnabled.has(pluginName)) {
        this.config.PluginEnabled.set(pluginName, true);
        plugin.setting.enabled = true;
      } else {
        const isEnabled = this.config.PluginEnabled.get(pluginName);
        this.config.PluginEnabled.set(pluginName, isEnabled);
        plugin.setting.enabled = isEnabled;
      }
      pluginText.push(`${pluginName}: ${plugin.setting.enabled ? "§aEnabled" : "§cDisabled"}`);
    })

    const i = system.runInterval(() => {
      const players = world.getPlayers();
      if (players.length > 0) {
        system.clearRun(i);
        pluginText.forEach(text => {
          world.sendMessage(`§7[All Stacker] §r${text}`);
        });
      }
    })
    this.config.LoadedConfig = true;
  }
  public onShutdown(ev: ShutdownEvent): void { }

  public onStartup(ev: StartupEvent): void {
    KXEvents.on(this, "after:playerSpawn", (ev) => {
      if (!ev.initialSpawn) return;
      const isFirstJoin = !ev.player.getTags().includes("kisu:joined_before");
      if (isFirstJoin) {
        ev.player.addTag("kisu:joined_before");
        this.giveConfigMenu(ev.player);
      }
    })
    const showConfig = this.showConfig.bind(this);
    ev.itemComponentRegistry.registerCustomComponent("kisu:show_config", {
      onUse(ev: ItemComponentUseEvent): void {
        showConfig(ev.source);
      }
    })
  }

  public giveConfigMenu(pl: Player): void {
    const containers = pl.getComponent("inventory");
    const configMenuItem = new ItemStack("kisu:ac_setting", 1);
    if (containers.container.emptySlotsCount > 0) {
      containers.container.addItem(configMenuItem);
    } else {
      pl.dimension.spawnItem(configMenuItem, pl.location);
    }
  }
}

export default ConfigMenu;