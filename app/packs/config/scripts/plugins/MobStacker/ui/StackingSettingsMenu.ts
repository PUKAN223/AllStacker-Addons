// ─── MobStacker › ui › StackingSettingsMenu ───────────────────────────────────
//
// Recreates the old "Stacking Settings" sub-page that lets operators
// add, remove, and view mobs in the StackMob list (mobs that ARE stacked).
// Logic uses the new adapter: reads/writes via plugin.config.set().
// ─────────────────────────────────────────────────────────────────────────────

import { Player } from "@minecraft/server";
import { IActionForm, LanguageManager } from "@axeth/api";
import type { MobStackerPlugin } from "../index.ts";

// ─── helpers ──────────────────────────────────────────────────────────────────

const mobName = (id: string): string =>
  (id.split(":")[1] ?? id)
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

function getStackMobList(plugin: MobStackerPlugin): string[] {
  const v = plugin.config.get()?.[`StackMob`]?.value;
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function setStackMobList(plugin: MobStackerPlugin, list: string[]): void {
  const config = plugin.config.get() ?? {};
  const setting = plugin.getPluginSettings()["StackMob"];
  config["StackMob"] = { ...setting!, value: list.join(",") };
  plugin.config.set(config);
}

// ─── main export ─────────────────────────────────────────────────────────────

/**
 * Shows the "Stacking Settings" IActionForm with Add / Remove / View buttons.
 * Pass `onBack` so the Back button can navigate back to the plugin sub-menu.
 */
export function showMobStackingSettings(
  pl: Player,
  plugin: MobStackerPlugin,
  onBack: () => void,
): void {
  const t = LanguageManager.getInstance().for(pl);

  const form = IActionForm.createForm(
    t("allstacker.title.mob_stacking_settings"),
    t("allstacker.body.mob_stacking_settings"),
  );

  form.addDivider();
  form.addLabel(t("allstacker.label.mobstacker.description"));

  // ── Add Stacked Mob ─────────────────────────────────────────────────────────
  form.addButton(
    t("allstacker.button.add_stacked_mobs"),
    "textures/ui/icon_book_writable",
    () => {
      showAddStackedMob(pl, plugin, () =>
        showMobStackingSettings(pl, plugin, onBack));
    },
  );

  // ── Remove Stacked Mob ──────────────────────────────────────────────────────
  form.addButton(
    t("allstacker.button.remove_stacked_mobs"),
    "textures/ui/icon_book_writable",
    () => {
      showRemoveStackedMob(pl, plugin, () =>
        showMobStackingSettings(pl, plugin, onBack));
    },
  );

  // ── View Stacked Mobs ───────────────────────────────────────────────────────
  form.addButton(
    t("allstacker.button.view_stacked_mobs"),
    "textures/ui/icon_book_writable",
    () => {
      showViewStackedMobs(pl, plugin, () =>
        showMobStackingSettings(pl, plugin, onBack));
    },
  );

  form.addDivider();
  form.addButton(t("allstacker.button.back"), "", onBack);

  form.show(pl).catch(() => {});
}

// ─── Add ───────────────────────────────────────────────────────────────────────

function showAddStackedMob(
  pl: Player,
  plugin: MobStackerPlugin,
  onBack: () => void,
): void {
  const t = LanguageManager.getInstance().for(pl);
  const stackMobList = getStackMobList(plugin);

  // Scan nearby entities (radius 10) that aren't already in the list and aren't players
  const nearEntities = pl.dimension.getEntities({
    location: pl.location,
    maxDistance: 10,
  }).filter((en) => en.typeId !== "minecraft:player" && !stackMobList.includes(en.typeId));

  // Deduplicate by typeId
  const uniqueMobs: Map<string, string> = new Map();
  nearEntities.forEach((en) => {
    if (en.isValid) uniqueMobs.set(en.typeId, mobName(en.typeId));
  });

  const form = IActionForm.createForm(
    t("allstacker.button.add_stacked_mobs"),
    t("allstacker.body.mob_stacking_settings"),
  );
  form.addDivider();
  form.addLabel(t("allstacker.label.mobstacker.description"));

  if (uniqueMobs.size === 0) {
    form.addLabel(t("allstacker.label.no_new_mobs"));
  } else {
    uniqueMobs.forEach((name, typeId) => {
      form.addButton(name, "", () => {
        const list = getStackMobList(plugin);
        if (!list.includes(typeId)) {
          list.push(typeId);
          setStackMobList(plugin, list);
          pl.sendMessage(t("allstacker.message.mobstacker.added").replace("%value", name));
        }
        onBack();
      });
    });
  }

  form.addDivider();
  form.addButton(t("allstacker.button.back"), "", onBack);

  form.show(pl).catch(() => {});
}

// ─── Remove ────────────────────────────────────────────────────────────────────

function showRemoveStackedMob(
  pl: Player,
  plugin: MobStackerPlugin,
  onBack: () => void,
): void {
  const t = LanguageManager.getInstance().for(pl);
  const stackMobList = getStackMobList(plugin);

  const form = IActionForm.createForm(
    t("allstacker.button.remove_stacked_mobs"),
    t("allstacker.body.mob_stacking_settings"),
  );
  form.addDivider();
  form.addLabel(t("allstacker.label.mobstacker.description"));

  if (stackMobList.length === 0) {
    form.addLabel(t("allstacker.label.no_stacked_mobs"));
  } else {
    stackMobList.forEach((typeId) => {
      const name = mobName(typeId);
      form.addButton(name, "", () => {
        const list = getStackMobList(plugin);
        const updated = list.filter((id) => id !== typeId);
        setStackMobList(plugin, updated);
        pl.sendMessage(t("allstacker.message.mobstacker.removed").replace("%value", name));
        onBack();
      });
    });
  }

  form.addDivider();
  form.addButton(t("allstacker.button.back"), "", onBack);

  form.show(pl).catch(() => {});
}

// ─── View ─────────────────────────────────────────────────────────────────────

function showViewStackedMobs(
  pl: Player,
  plugin: MobStackerPlugin,
  onBack: () => void,
): void {
  const t = LanguageManager.getInstance().for(pl);
  const stackMobList = getStackMobList(plugin);

  const form = IActionForm.createForm(
    t("allstacker.button.view_stacked_mobs"),
    t("allstacker.body.mob_stacking_settings"),
  );
  form.addDivider();
  form.addLabel(t("allstacker.label.mobstacker.description"));

  if (stackMobList.length === 0) {
    form.addLabel(t("allstacker.label.no_stacked_mobs"));
  } else {
    stackMobList.forEach((typeId) => {
      form.addButton(mobName(typeId), "", onBack);
    });
  }

  form.addDivider();
  form.addButton(t("allstacker.button.back"), "", onBack);

  form.show(pl).catch(() => {});
}
