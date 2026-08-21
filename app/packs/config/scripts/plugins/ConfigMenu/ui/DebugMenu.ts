import { Player } from "@minecraft/server";
import { IActionForm, LanguageManager } from "@axeth/api";
import type { ConfigMenuPlugin } from "../index.ts";
import type { ItemStackerPlugin } from "../../ItemStacker/index.ts";
import type { MobStackerPlugin } from "../../MobStacker/index.ts";

export function showDebugMenu(pl: Player, plugin: ConfigMenuPlugin, onBack: () => void): void {
  const t = LanguageManager.getInstance().for(pl);
  const form = IActionForm.createForm(
    t("allstacker.ui.debug_data"),
    t("allstacker.body.debug.data"),
  );

  form.addDivider();

  form.addButton(t("allstacker.title.debug.itemstacker"), "", () => {
    showItemStackerDebug(pl, plugin, () => showDebugMenu(pl, plugin, onBack));
  });

  form.addButton(t("allstacker.title.debug.mobstacker"), "", () => {
    showMobStackerDebug(pl, plugin, () => showDebugMenu(pl, plugin, onBack));
  });

  form.addButton(t("allstacker.title.debug.config"), "textures/ui/advanced_glyph_color", () => {
    showMemoryUsage(pl, plugin, () => showDebugMenu(pl, plugin, onBack));
  });

  form.addDivider();
  form.addButton(t("allstacker.button.back"), "", () => {
    onBack();
  });

  form.show(pl).catch(() => {});
}

function showItemStackerDebug(pl: Player, plugin: ConfigMenuPlugin, onBack: () => void): void {
  const itemStacker = plugin.systemBase.pluginManagers.getPlugins().find(p => p.name === "ItemStacker") as ItemStackerPlugin | undefined;
  if (!itemStacker || !itemStacker.getStats) {
    pl.sendMessage("§cItemStacker plugin not found or unsupported version.");
    onBack();
    return;
  }

  const stats = itemStacker.getStats();
  
  const debugInfo = [
    "§e> §bItem Stacker Debug§r\n",
    `§8Items in tracking list: §f${stats.pendingItems}`,
    `§8Items in database: §f${stats.trackedItems}`,
    `§8Fast Mode: §f${stats.fastMode}`,
    `§8Radius Combine: §f${stats.radiusCombine}`,
    `§8Radius Seeing: §f${stats.radiusSeeing}`,
    `§8Unstack Items: §f${stats.unstackListSize}`,
  ];

  const t = LanguageManager.getInstance().for(pl);
  const page = IActionForm.createForm(t("allstacker.title.debug.itemstacker"), t("allstacker.body.debug.data"));
  page.addDivider();
  page.addLabel(debugInfo.join("\n"));
  page.addDivider();
  page.addButton("§c§lClear Data", "textures/ui/trash_default", () => {
    itemStacker.clearData();
    pl.sendMessage(t("allstacker.message.debug.itemstacker.cleared"));
    onBack();
  });
  page.addButton("§6Reset Config to Default", "textures/ui/refresh_light", () => {
    itemStacker.resetConfig();
    pl.sendMessage(t("allstacker.message.debug.itemstacker.reset"));
    onBack();
  });
  page.addButton(t("allstacker.button.back"), "", onBack);

  page.show(pl).catch(() => {});
}

function showMobStackerDebug(pl: Player, plugin: ConfigMenuPlugin, onBack: () => void): void {
  const mobStacker = plugin.systemBase.pluginManagers.getPlugins().find(p => p.name === "MobStacker") as MobStackerPlugin | undefined;
  if (!mobStacker || !mobStacker.getStats) {
    pl.sendMessage("§cMobStacker plugin not found or unsupported version.");
    onBack();
    return;
  }

  const stats = mobStacker.getStats();

  const debugInfo = [
    "§e> §bMob Stacker Debug§r\n",
    `§8Reset entities set: §f${stats.resetEntitiesSize}`,
    `§8XP Queue size: §f${stats.xpQueueSize}`,
    `§8Radius Stacking: §f${stats.radiusStacking}`,
    `§8Mob Death Mode: §f${stats.mobDeathMode}`,
    `§8Stacked Mobs: §f${stats.stackMobListSize}`,
  ];

  const t = LanguageManager.getInstance().for(pl);
  const page = IActionForm.createForm(t("allstacker.title.debug.mobstacker"), t("allstacker.body.debug.data"));
  page.addDivider();
  page.addLabel(debugInfo.join("\n"));
  page.addDivider();
  page.addButton("§c§lClear Data", "textures/ui/trash_default", () => {
    mobStacker.clearData();
    pl.sendMessage(t("allstacker.message.debug.mobstacker.cleared"));
    onBack();
  });
  page.addButton("§6Reset Config to Default", "textures/ui/refresh_light", () => {
    mobStacker.resetConfig();
    pl.sendMessage(t("allstacker.message.debug.mobstacker.reset"));
    onBack();
  });
  page.addButton(t("allstacker.button.back"), "", onBack);

  page.show(pl).catch(() => {});
}

function showMemoryUsage(pl: Player, plugin: ConfigMenuPlugin, onBack: () => void): void {
  const itemStacker = plugin.systemBase.pluginManagers.getPlugins().find(p => p.name === "ItemStacker") as ItemStackerPlugin | undefined;
  const mobStacker = plugin.systemBase.pluginManagers.getPlugins().find(p => p.name === "MobStacker") as MobStackerPlugin | undefined;

  let totalItems = 0;
  let totalMobs = 0;

  if (itemStacker && itemStacker.getStats) {
    const stats = itemStacker.getStats();
    totalItems = stats.pendingItems + stats.trackedItems;
  }

  if (mobStacker && mobStacker.getStats) {
    const stats = mobStacker.getStats();
    totalMobs = stats.resetEntitiesSize + stats.xpQueueSize;
  }

  const debugInfo = [
    "§e> Config Usage\n",
    `§8Total Tracked Items: §f${totalItems}`,
    `§8Total Tracked Mobs: §f${totalMobs}`,
    `§8Total Entities: §f${totalItems + totalMobs}`,
  ];

  const t = LanguageManager.getInstance().for(pl);
  const page = IActionForm.createForm(t("allstacker.title.debug.config"), t("allstacker.body.debug.config"));
  page.addDivider();
  page.addLabel(debugInfo.join("\n"));
  page.addDivider();
  page.addButton(t("allstacker.button.back"), "", () => {
    onBack();
  });

  page.show(pl).catch(() => {});
}


