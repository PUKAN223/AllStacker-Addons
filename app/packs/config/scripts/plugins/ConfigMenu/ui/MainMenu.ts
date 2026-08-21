import { Player, PlayerPermissionLevel, system } from "@minecraft/server";
import {
  IActionForm,
  LanguageManager,
  PluginBase,
  SettingMenu,
} from "@axeth/api";
import type { ConfigMenuPlugin } from "../index.ts";
import { showLanguageMenu } from "./LanguageMenu.ts";
import { showDebugMenu } from "./DebugMenu.ts";

export function showMainMenu(pl: Player, plugin: ConfigMenuPlugin): void {
  const pluginManagers = plugin.systemBase.pluginManagers;
  const pluginList = pluginManagers.getPlugins().filter((p) =>
    p.name !== plugin.name && !p.isRuntime
  );
  const t = LanguageManager.getInstance().for(pl);

  const form = IActionForm.createForm(
    t("allstacker.title.configmenu"),
    t("allstacker.body.configmenu"),
  );

  form.addButton(
    t("allstacker.button.language"),
    "textures/ui/world_glyph_color_2x_black_outline",
    () => {
      showLanguageMenu(pl, () => showMainMenu(pl, plugin));
    },
  );

  form.addDivider();

  form.addLabel(
    `${t("allstacker.label.plugin.list")} §7(§c${pluginList.length}§7)§r`,
  );

  pluginList.forEach((p) => {
    const statusText = p.isEnabled()
      ? t("allstacker.label.plugin.enabled")
      : t("allstacker.label.plugin.disabled");
    const icon = p.icon || "textures/ui/icon_book_writable";
    form.addButton(`${p.name}\n[${statusText}]`, icon, () => {
      openPluginSettings(p, pl, plugin);
    });
  });

  if (pl.playerPermissionLevel == PlayerPermissionLevel.Operator) {
    form.addDivider();
    form.addLabel(t("allstacker.ui.developer"));
    form.addButton(
      t("allstacker.ui.debug_data"),
      "textures/ui/Add-Ons_Side-Nav_Icon_24x24",
      () => {
        showDebugMenu(pl, plugin, () => showMainMenu(pl, plugin));
      },
    );
  }

  form.show(pl).catch(() => {});
}

function openPluginSettings(
  targetPlugin: PluginBase,
  pl: Player,
  configPlugin: ConfigMenuPlugin,
): void {
  const settingsObj = targetPlugin.getPluginSettings();
  if (Object.keys(settingsObj).length === 0) {
    pl.sendMessage(`§cNo settings available for ${targetPlugin.name}.§r`);
    showMainMenu(pl, configPlugin);
    return;
  }

  const t = LanguageManager.getInstance().for(pl);
  const showSubMenu = () => openPluginSettings(targetPlugin, pl, configPlugin);
  const advancedSettings = targetPlugin.getAdvancedSettings(
    pl as never,
    targetPlugin as never,
    showSubMenu,
  );

  const showDefaultSettings = () => {
    const settingMenu = new SettingMenu(targetPlugin, settingsObj, pl);
    const page = settingMenu.getPage();
    page.setSubmitButton(t("allstacker.ui.save"));

    page.show(pl).then(async (res) => {
      if (!res || res.canceled) {
        system.runTimeout(() => showMainMenu(pl, configPlugin), 2);
        return;
      }

      const config = targetPlugin.config.get() ?? {};
      const settingsKeys = Object.keys(settingsObj).filter((key) =>
        settingsObj[key]?.canUserModify !== false
      );
      const wasEnabled = targetPlugin.isEnabled();

      if (res.formValues) {
        let settingIndex = 0;
        for (let i = 1; i < res.formValues.length; i++) {
          const value = res.formValues[i];
          if (value === undefined) continue;

          const key = settingsKeys[settingIndex];
          if (!key) break;

          const setting = settingsObj[key];
          if (!setting) {
            settingIndex++;
            continue;
          }

          let convertedValue = value;
          if (setting.type === "number" || setting.type === "array") {
            convertedValue = Number(value);
          }
          if (setting.type === "boolean") convertedValue = Boolean(value);

          config[key] = { ...setting, value: convertedValue };
          settingIndex++;
        }
      }

      targetPlugin.config.set(config);
      pl.sendMessage(
        `§7[All Stacker] §rSettings saved for ${targetPlugin.name}.`,
      );

      const nowEnabled = targetPlugin.isEnabled();
      if (wasEnabled !== nowEnabled) {
        await configPlugin.systemBase.pluginManagers.applyPluginState(
          targetPlugin,
        );
      }

      system.runTimeout(() => showMainMenu(pl, configPlugin), 2);
    }).catch(() => {});
  };

  if (advancedSettings) {
    // Old-style sub-menu: IActionForm with category buttons
    const subMenu = IActionForm.createForm(
      t("allstacker.title.configmenu"),
      `${targetPlugin.name}`,
    );

    subMenu.addDivider();
    subMenu.addButton(
      t("allstacker.button.stacking_settings"),
      "textures/blocks/barrier",
      () => {
        if (advancedSettings) advancedSettings();
      },
    );
    subMenu.addButton(
      t("allstacker.button.advanced_settings"),
      "textures/ui/settings_glyph_color_2x",
      () => {
        showDefaultSettings();
      },
    );
    subMenu.addDivider();
    subMenu.addButton(
      t("allstacker.button.back"),
      "",
      () => showMainMenu(pl, configPlugin),
    );

    subMenu.show(pl).catch(() => {});
  } else {
    showDefaultSettings();
  }
}
