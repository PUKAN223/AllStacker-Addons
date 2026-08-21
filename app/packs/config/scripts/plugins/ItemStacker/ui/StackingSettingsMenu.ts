// ─── ItemStacker › ui › StackingSettingsMenu ──────────────────────────────────
//
// Recreates the old "Stacking Settings" sub-page that lets operators
// add, remove, and view items in the UnStackList (items that are never stacked).
// Logic uses the new adapter: reads/writes via plugin.config.set().
// ─────────────────────────────────────────────────────────────────────────────

import { Player, ItemStack } from "@minecraft/server";
import { IActionForm, LanguageManager } from "@axeth/api";
import type { ItemStackerPlugin } from "../index.ts";

// ─── helpers ──────────────────────────────────────────────────────────────────

const itemName = (id: string): string =>
  (id.split(":")[1] ?? id)
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

function getUnStackList(plugin: ItemStackerPlugin): string[] {
  const v = plugin.config.get()?.[`UnStackList`]?.value;
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function setUnStackList(plugin: ItemStackerPlugin, list: string[]): void {
  const config = plugin.config.get() ?? {};
  const setting = plugin.getPluginSettings()["UnStackList"];
  config["UnStackList"] = { ...setting!, value: list.join(",") };
  plugin.config.set(config);
}

// ─── main export ─────────────────────────────────────────────────────────────

/**
 * Shows the "Stacking Settings" IActionForm with Add / Remove / View buttons.
 * Pass `onBack` so the Back button can navigate back to the plugin sub-menu.
 */
export function showItemStackingSettings(
  pl: Player,
  plugin: ItemStackerPlugin,
  onBack: () => void,
): void {
  const t = LanguageManager.getInstance().for(pl);

  const form = IActionForm.createForm(
    t("allstacker.title.unstacked"),
    t("allstacker.body.unstacked"),
  );

  form.addDivider();
  form.addLabel(t("allstacker.label.unstacked"));

  // ── Add Unstacked Item ──────────────────────────────────────────────────────
  form.addButton(
    t("allstacker.button.add_unstacked"),
    "textures/ui/icon_book_writable",
    () => {
      showAddUnstackedItem(pl, plugin, () =>
        showItemStackingSettings(pl, plugin, onBack));
    },
  );

  // ── Remove Unstacked Item ───────────────────────────────────────────────────
  form.addButton(
    t("allstacker.button.remove_unstacked"),
    "textures/ui/icon_book_writable",
    () => {
      showRemoveUnstackedItem(pl, plugin, () =>
        showItemStackingSettings(pl, plugin, onBack));
    },
  );

  // ── View Unstacked Items ────────────────────────────────────────────────────
  form.addButton(
    t("allstacker.button.view_unstacked"),
    "textures/ui/icon_book_writable",
    () => {
      showViewUnstackedItems(pl, plugin, () =>
        showItemStackingSettings(pl, plugin, onBack));
    },
  );

  form.addDivider();
  form.addButton(t("allstacker.button.back"), "", onBack);

  form.show(pl).catch(() => {});
}

// ─── Add ───────────────────────────────────────────────────────────────────────

function showAddUnstackedItem(
  pl: Player,
  plugin: ItemStackerPlugin,
  onBack: () => void,
): void {
  const t = LanguageManager.getInstance().for(pl);
  const inventory = pl.getComponent("inventory");
  if (!inventory?.container) { onBack(); return; }

  const unStackList = getUnStackList(plugin);

  // Collect unique items from the player's inventory that aren't already in the list
  const itemMap: Map<string, string> = new Map(); // typeId → display name
  for (let i = 0; i < inventory.container.size; i++) {
    const item: ItemStack | undefined = inventory.container.getItem(i);
    if (item && !unStackList.includes(item.typeId)) {
      itemMap.set(item.typeId, itemName(item.typeId));
    }
  }

  const form = IActionForm.createForm(
    t("allstacker.button.add_unstacked"),
    t("allstacker.body.unstacked"),
  );
  form.addDivider();
  form.addLabel(t("allstacker.label.unstacked"));

  if (itemMap.size === 0) {
    form.addLabel(t("allstacker.label.no_new_items"));
  } else {
    itemMap.forEach((name, typeId) => {
      form.addButton(name, "", () => {
        const list = getUnStackList(plugin);
        if (!list.includes(typeId)) {
          list.push(typeId);
          setUnStackList(plugin, list);
          pl.sendMessage(t("allstacker.message.itemstacker.added").replace("%value", name));
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

function showRemoveUnstackedItem(
  pl: Player,
  plugin: ItemStackerPlugin,
  onBack: () => void,
): void {
  const t = LanguageManager.getInstance().for(pl);
  const unStackList = getUnStackList(plugin);

  const form = IActionForm.createForm(
    t("allstacker.button.remove_unstacked"),
    t("allstacker.body.unstacked"),
  );
  form.addDivider();
  form.addLabel(t("allstacker.label.unstacked"));

  if (unStackList.length === 0) {
    form.addLabel(t("allstacker.label.no_unstacked_items"));
  } else {
    unStackList.forEach((typeId) => {
      const name = itemName(typeId);
      form.addButton(name, "", () => {
        const list = getUnStackList(plugin);
        const updated = list.filter((id) => id !== typeId);
        setUnStackList(plugin, updated);
        pl.sendMessage(t("allstacker.message.itemstacker.removed").replace("%value", name));
        onBack();
      });
    });
  }

  form.addDivider();
  form.addButton(t("allstacker.button.back"), "", onBack);

  form.show(pl).catch(() => {});
}

// ─── View ─────────────────────────────────────────────────────────────────────

function showViewUnstackedItems(
  pl: Player,
  plugin: ItemStackerPlugin,
  onBack: () => void,
): void {
  const t = LanguageManager.getInstance().for(pl);
  const unStackList = getUnStackList(plugin);

  const form = IActionForm.createForm(
    t("allstacker.button.view_unstacked"),
    t("allstacker.body.unstacked"),
  );
  form.addDivider();
  form.addLabel(t("allstacker.label.unstacked"));

  if (unStackList.length === 0) {
    form.addLabel(t("allstacker.label.no_unstacked_items"));
  } else {
    unStackList.forEach((typeId) => {
      form.addButton(itemName(typeId), "", onBack);
    });
  }

  form.addDivider();
  form.addButton(t("allstacker.button.back"), "", onBack);

  form.show(pl).catch(() => {});
}
