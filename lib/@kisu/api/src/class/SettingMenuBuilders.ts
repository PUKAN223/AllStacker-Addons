import { Player } from "@minecraft/server";
import {
  IActionForm,
  IModalForm,
  PluginBase,
  PluginManagers,
  PluginSettingOptions,
} from "@kisu/api";

class SettingMenuBuilders {
  private menus = new Map<string, SettingMenu>();

  public registerMenu(menu: SettingMenu, plugin: PluginBase): void {
    this.menus.set(plugin.name, menu);
  }

  public settingMenu(pl: Player, pluginManagers: PluginManagers): void {
    const plugins = pluginManagers.getPlugins();

    const settingMain = new IActionForm(
      `Settings Menu`,
      `§fHello, §e${pl.name}§r\n\nThis is the configuration menu.\nYou can manage settings here.`,
    );

    settingMain.addDivider();
    settingMain.addLabel(`§7Plugins (§c${plugins.length}§7)§r`);

    for (const plugin of plugins) {
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
    const settings = new SettingMenu(plugin, plugin.getSettings());
    const statusText = plugin.isEnabled() ? "§2Enabled" : "§cDisabled";

    form.addButton(
      `${settings.buttons.name}\n§8[${statusText}§8]`,
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
    const settings = new SettingMenu(plugin, plugin.getSettings());
    const page = settings.getPage();

    page.show(player).then((res) => {
      if (res.canceled) return;

      this.savePluginSettings(plugin, res.formValues as (string | number | boolean)[]);
      this.settingMenu(player, pluginManagers);
    });
  }

  private savePluginSettings(
    plugin: PluginBase,
    formValues: (string | number | boolean)[],
  ): void {
    const startIndex = 2; // Skip label and divider
    const config = plugin.config.get() ?? {};
    const settingsKeysNone = Object.keys(plugin.getSettings());
    const settingsKeys = settingsKeysNone.filter(
      (key) => plugin.getSettings()[key].canUserModify !== false,
    );

    for (let i = startIndex; i < formValues.length - 1; i++) {
      const value = formValues[i];
      if (value === undefined) continue;

      const key = settingsKeys[i - startIndex];
      const setting = plugin.getSettings()[key];
      if (!setting) continue;

      config[key] = {
        ...setting,
        value: this.convertSettingValue(setting.type, value),
      };
    }

    plugin.config.set(config);
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

  constructor(plugin: PluginBase, settings: PluginSettingOptions) {
    this.plugin = plugin;
    this.settings = settings;
  }

  get buttons() {
    return {
      name: this.plugin.name,
      description: `Settings for ${this.plugin.name.mcColors().blue} plugin`,
      icon: this.plugin.icon || "textures/items/compass_item",
    };
  }

  public getPage(): IModalForm {
    const config = this.plugin.config.get() ?? {};

    const forms = new IModalForm(
      `${this.plugin.name} Settings`,
      `Save changes.`,
    );

    forms.addLabel(this.buttons.description.mcColors().grey);
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
            key,
            (savedValue ?? defaultValue) as boolean,
            setting.description,
          );
          break;

        case "string":
          forms.addTextField(
            key,
            setting.description,
            (savedValue ?? defaultValue) as string,
            setting.description,
          );
          break;

        case "number":
          forms.addSlider(
            key,
            1,
            setting.maxValue ?? 100,
            1,
            (savedValue ?? defaultValue) as number,
            setting.description,
          );
          break;

        case "array":
          forms.addDropdown(
            key,
            (defaultValue as (string | number | boolean)[]).map(String),
            typeof savedValue === "number" ? savedValue : 0,
            setting.description,
          );
          break;
      }
    }
  }
}

export { SettingMenu, SettingMenuBuilders };
