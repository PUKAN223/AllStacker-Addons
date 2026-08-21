import { IActionForm } from  "@packages/api/src/class/forms/IActionForm.ts";
import { IModalForm } from  "@packages/api/src/class/forms/IModalForm.ts";
import type { Player } from "@minecraft/server";
import type { PluginBase } from  "@packages/api/src/class/PluginBase.ts";
import type { PluginManagers } from  "@packages/api/src/class/PluginManagers.ts";
import type { PluginSettingOptions } from  "@packages/api/src/types/PluginSettingOptions.ts";
import { MinecraftColors } from "@axeth/api";

import { LanguageManager } from "@axeth/api";

class SettingMenuBuilders {
  private menus = new Map<string, SettingMenu>();

  public registerMenu(menu: SettingMenu, plugin: PluginBase): void {
    this.menus.set(plugin.name, menu);
  }

  public settingMenu(pl: Player, pluginManagers: PluginManagers): void {
    const plugins = pluginManagers.getPlugins();
    const t = LanguageManager.getInstance().for(pl);

    const settingMain = IActionForm.createForm(
      t("allstacker.title.configmenu"),
      t("allstacker.body.configmenu"),
    );

    settingMain.addButton(t("allstacker.button.settings"), "textures/ui/icon_setting", () => {});
    settingMain.addDivider();
    
    // Custom logic to handle dynamic plugin count in translation if needed, or stick to simple string
    const pluginListText = t("allstacker.label.plugin.list");
    settingMain.addLabel(`§f${pluginListText} (§c${plugins.length - 1}§7)§r`);

    for (const plugin of plugins) {
      if (plugin.isRuntime) continue;
      this.addPluginButton(settingMain, plugin, pl, pluginManagers);
    }

    settingMain.show(pl);
  }

  private addPluginButton(
    form: IActionForm,
    plugin: PluginBase,
    player: Player,
    pluginManagers: PluginManagers,
  ): void {
    const settings = new SettingMenu(plugin, plugin.getPluginSettings(), player);
    const t = LanguageManager.getInstance().for(player);
    
    const enabledText = t("allstacker.label.plugin.enabled");
    const disabledText = t("allstacker.label.plugin.disabled");
    
    const statusText = plugin.isEnabled()
      ? `§8[§2${enabledText}§8]`
      : `§8[§c${disabledText}§8]`;

    form.addButton(
      `§f${settings.buttons.name}\n${statusText}`,
      settings.buttons.icon,
      () => {
        this.showPluginSettingsPage(plugin, player, pluginManagers);
      },
    );
  }

  private showPluginSettingsPage(
    plugin: PluginBase,
    player: Player,
    pluginManagers: PluginManagers,
  ): void {
    const settings = new SettingMenu(plugin, plugin.getPluginSettings(), player);
    const advancedSettings = plugin.getAdvancedSettings(player, plugin, () => this.settingMenu(player, pluginManagers));
    const t = LanguageManager.getInstance().for(player);

    const showDefaultSettings = () => {
      const page = settings.getPage();
      page.setSubmitButton("§8" + t("allstacker.ui.save"));

      page.show(player)
        .then(async (res) => {
          if (!res) return;
          if (res.canceled) return;

          await this.savePluginSettings(
            plugin,
            res.formValues as (string | number | boolean)[],
            pluginManagers,
          );

          this.settingMenu(player, pluginManagers);
        })
        .catch(() => {});
    };

    const showAdvancedSettings = () => {
      advancedSettings!();
    };

    if (advancedSettings) {
      const settingSelectionMenu = IActionForm.createForm(
        t("allstacker.title.configmenu"),
        t("allstacker.body.choose_option"),
      );
      settingSelectionMenu.addButton(
        "§f" + t("allstacker.button.advanced_settings"),
        "textures/ui/settings_glyph_color_2x",
        () => {
          showAdvancedSettings();
        },
      );
      settingSelectionMenu.addButton(
        "§f" + t("allstacker.button.stacking_settings"),
        "textures/ui/icon_setting",
        () => {
          showDefaultSettings();
        },
      );
      settingSelectionMenu.show(player).catch(() => {});
    } else {
      showDefaultSettings();
    }
  }

  private async savePluginSettings(
    plugin: PluginBase,
    formValues: (string | number | boolean)[],
    pluginManagers: PluginManagers,
  ): Promise<void> {
    const startIndex = 0;
    const config = plugin.config.get() ?? {};
    const settingsKeysNone = Object.keys(plugin.getPluginSettings());
    const settingsKeys = settingsKeysNone.filter(
      (key) => plugin.getPluginSettings()[key]?.canUserModify !== false,
    );

    for (let i = startIndex; i < formValues.length; i++) {
      const value = formValues[i];
      if (value === undefined) continue;

      const key = settingsKeys[i - startIndex];
      if (!key) continue;
      const setting = plugin.getPluginSettings()[key];
      if (!setting) continue;

      config[key] = {
        ...setting,
        value: this.convertSettingValue(setting.type, value),
      };
    }

    plugin.config.set(config);

    await pluginManagers.applyPluginState(plugin);
  }

  private convertSettingValue(
    type: "string" | "number" | "boolean" | "array",
    value: string | number | boolean,
  ): string | number | boolean {
    switch (type) {
      case "number":
      case "array":
        return Number(value);
      case "boolean":
        return Boolean(value);
      default:
        return String(value);
    }
  }
}

class SettingMenu {
  private plugin: PluginBase;
  private settings: PluginSettingOptions;
  private player?: Player;
  private MCColors = (str: string) => new MinecraftColors(str);
  private lang = LanguageManager.getInstance();

  constructor(plugin: PluginBase, settings: PluginSettingOptions, player?: Player) {
    this.plugin = plugin;
    this.settings = settings;
    this.player = player;
  }

  get buttons(): { name: string; description: string; icon: string } {
    const t = this.player ? this.lang.for(this.player) : (k: string) => this.lang.getTranslation(k);
    
    // Attempt to translate plugin name if it has a key, otherwise fallback to plugin.name
    const titleKey = `allstacker.title.${this.plugin.name.toLowerCase()}`;
    const translatedName = t(titleKey);
    const finalName = translatedName !== titleKey ? translatedName : this.plugin.name;

    const descKey = `allstacker.body.${this.plugin.name.toLowerCase()}`;
    const translatedDesc = t(descKey);
    const finalDesc = translatedDesc !== descKey ? translatedDesc : `§fSettings for ${this.plugin.name} plugin`;

    return {
      name: finalName,
      description: finalDesc,
      icon: this.plugin.icon || "textures/items/compass_item",
    };
  }

  public getPage(): IModalForm {
    const config = this.plugin.config.get() ?? {};
    const t = this.player ? this.lang.for(this.player) : (k: string) => this.lang.getTranslation(k);

    const forms = IModalForm.createForm(
      this.buttons.name,
      t("allstacker.ui.save"),
    );

    const labelKey = `allstacker.label.${this.plugin.name.toLowerCase()}.advanced.description_full`;
    const translatedLabel = t(labelKey);
    if (translatedLabel !== labelKey) {
      forms.addLabel(translatedLabel);
      // Removed addDivider() here as requested by comments not to add dividers.
    }

    forms.addLabel(this.MCColors(this.buttons.description).grey);
    // NOTE: Do NOT add dividers here — MCBE ModalFormData.divider() may shift
    // formValues indices, causing settings to be saved to the wrong keys.

    if (Object.keys(this.settings).length === 0) {
      forms.addLabel(t("allstacker.label.no_settings"));
      return forms;
    }

    this.addSettingFields(forms, config, t);

    return forms;
  }

  private addSettingFields(
    forms: IModalForm,
    config: PluginSettingOptions,
    t: (key: string) => string
  ): void {
    for (const [key, setting] of Object.entries(this.settings)) {
      if (setting.canUserModify === false) continue;

      const savedValue = config[key]?.value;
      const defaultValue = setting.default;
      
      const translatedLabel = t(key);
      const translatedTooltip = setting.description ? t(setting.description) : undefined;

      switch (setting.type) {
        case "boolean":
          forms.addToggle(
            {
              label: translatedLabel,
              defaultValue: (savedValue ?? defaultValue) as boolean,
              tooltip: translatedTooltip,
            },
            () => {},
          );
          break;

        case "string":
          forms.addTextField(
            {
              label: translatedLabel,
              placeholderText: translatedTooltip,
              defaultValue: (savedValue ?? defaultValue) as string,
              tooltip: translatedTooltip,
            },
            () => {},
          );
          break;

        case "number":
          forms.addSlider(
            {
              label: translatedLabel,
              minimumValue: 1,
              maximumValue: setting.maxValue ?? 100,
              defaultValue: (savedValue ?? defaultValue) as number,
              valueStep: 1,
              tooltip: translatedTooltip,
            },
            () => {},
          );
          break;

        case "array":
          forms.addDropdown(
            {
              label: translatedLabel,
              options: (defaultValue as (string | number | boolean)[]).map(
                (opt) => t(String(opt))
              ),
              defaultValueIndex: typeof savedValue === "number"
                ? savedValue
                : 0,
              tooltip: translatedTooltip,
            },
            () => {},
          );
          break;
      }
    }
  }
}

export { SettingMenu, SettingMenuBuilders };
