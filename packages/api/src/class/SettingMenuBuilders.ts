import { IActionForm } from "./forms/IActionForm.ts";
import { IModalForm } from "./forms/IModalForm.ts";
import type { Player } from "@minecraft/server";
import type { PluginBase } from "./PluginBase.ts";
import type { PluginManagers } from "./PluginManagers.ts";
import type { PluginSettingOptions } from "../types/PluginSettingOptions.ts";
import { MinecraftColors } from "@axeth/api";

class SettingMenuBuilders {
  private menus = new Map<string, SettingMenu>();

  public registerMenu(menu: SettingMenu, plugin: PluginBase): void {
    this.menus.set(plugin.name, menu);
  }

  public settingMenu(pl: Player, pluginManagers: PluginManagers): void {
    const plugins = pluginManagers.getPlugins();

    const settingMain = IActionForm.createForm(
      `Settings Menu`,
      `§fHello, §e${pl.name}§r\n\nThis is the configuration menu.\nYou can manage settings here.`,
    );

    settingMain.addDivider();
    settingMain.addLabel(`§fPlugins (§c${plugins.length}§7)§r`);

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
    const settings = new SettingMenu(plugin, plugin.getPluginSettings());
    const statusText = plugin.isEnabled() ? "" : "";

    form.addButton(
      `§f${settings.buttons.name}   ${statusText}`,
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
    const settings = new SettingMenu(plugin, plugin.getPluginSettings());
    const advancedSettings = plugin.getAdvancedSettings(player, plugin);

    const showDefaultSettings = () => {
      const page = settings.getPage();
      page.setSubmitButton("§f" + page.getSubmitButtonText())

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
        "Settings Menu",
        "Choose an option:",
      );
      settingSelectionMenu.addButton(
        "§fAdvanced Settings",
        "textures/ui/settings_glyph_color_2x",
        () => {
          showAdvancedSettings();
        },
      );
      settingSelectionMenu.addButton(
        "§fDefault Settings",
        "textures/ui/icon_setting",
        () => {
          showDefaultSettings();
        },
      );
      settingSelectionMenu.show(player);
    } else {
      showDefaultSettings();
    }
  }

  private async savePluginSettings(
    plugin: PluginBase,
    formValues: (string | number | boolean)[],
    pluginManagers: PluginManagers,
  ): Promise<void> {
    const startIndex = 2; // Skip label and divider
    const config = plugin.config.get() ?? {};
    const settingsKeysNone = Object.keys(plugin.getPluginSettings());
    const settingsKeys = settingsKeysNone.filter(
      (key) => plugin.getPluginSettings()[key]?.canUserModify !== false,
    );

    for (let i = startIndex; i < formValues.length - 1; i++) {
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
  private MCColors = (str: string) => new MinecraftColors(str);

  constructor(plugin: PluginBase, settings: PluginSettingOptions) {
    this.plugin = plugin;
    this.settings = settings;
  }

  get buttons(): { name: string; description: string; icon: string } {
    return {
      name: this.plugin.name,
      description: `§fSettings for ${this.plugin.name} plugin`,
      icon: this.plugin.icon || "textures/items/compass_item",
    };
  }

  public getPage(): IModalForm {
    const config = this.plugin.config.get() ?? {};

    const forms = IModalForm.createForm(
      `${this.plugin.name} Settings`,
      `Save changes.`,
    );

    forms.addLabel(this.MCColors(this.buttons.description).grey);
    forms.addDivider();

    if (Object.keys(this.settings).length === 0) {
      forms.addLabel("§cNo settings available for this plugin.§r");
      forms.addDivider();
      return forms;
    }

    this.addSettingFields(forms, config);

    forms.addDivider();
    return forms;
  }

  private addSettingFields(
    forms: IModalForm,
    config: PluginSettingOptions,
  ): void {
    for (const [key, setting] of Object.entries(this.settings)) {
      if (setting.canUserModify === false) continue;

      const savedValue = config[key]?.value;
      const defaultValue = setting.default;

      switch (setting.type) {
        case "boolean":
          forms.addToggle(
            {
              label: key,
              defaultValue: (savedValue ?? defaultValue) as boolean,
              tooltip: setting.description,
            },
            () => {},
          );
          break;

        case "string":
          forms.addTextField(
            {
              label: key,
              placeholderText: setting.description,
              defaultValue: (savedValue ?? defaultValue) as string,
              tooltip: setting.description,
            },
            () => {},
          );
          break;

        case "number":
          forms.addSlider(
            {
              label: key,
              minimumValue: 1,
              maximumValue: setting.maxValue ?? 100,
              defaultValue: (savedValue ?? defaultValue) as number,
              valueStep: 1,
              tooltip: setting.description,
            },
            () => {},
          );
          break;

        case "array":
          forms.addDropdown(
            {
              label: key,
              options: (defaultValue as (string | number | boolean)[]).map(
                String,
              ),
              defaultValueIndex: typeof savedValue === "number"
                ? savedValue
                : 0,
              tooltip: setting.description,
            },
            () => {},
          );
          break;
      }
    }
  }
}

export { SettingMenu, SettingMenuBuilders };
