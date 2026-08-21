// ─── ItemStacker: onItemRemoved Handler ──────────────────────────────────────

import { Entity, EntityRemoveBeforeEvent, system } from "@minecraft/server";
import type { ItemStackingAdapter } from "../adapter/ItemStackingAdapter.ts";
import type { IRenderingAdapter } from "../../../api/interfaces/IRenderingAdapter.ts";
import type { StackEntry } from "../types/StackEntry.ts";

const PORTAL_BLOCK_IDS = new Set([
  "minecraft:portal",
  "minecraft:end_portal",
  "minecraft:end_gateway",
]);

export interface RemovedHandlerCtx {
  pendingStack: Map<string, Entity>;
  stackData: Map<string, StackEntry>;
  dimensionBackup: Map<string, StackEntry>;
  adapter: ItemStackingAdapter;
  rendering: IRenderingAdapter;
}

/**
 * Fired before any entity is removed from the world.
 *
 * Key responsibilities:
 *  1. Skip items that are still pending (not yet stacked).
 *  2. Skip items standing in a portal block (they're dimension-transferring,
 *     not truly being removed — the adapter's "Trying to" catch handles them).
 *  3. Snapshot all needed primitive values from the ItemStack NOW, before the
 *     engine invalidates the entity reference (hopper consume is synchronous).
 *  4. Defer the actual deStack work to system.run() to bypass Restricted
 *     Execution mode that is active inside Before events.
 */
export function onItemRemoved(
  ev: EntityRemoveBeforeEvent,
  ctx: RemovedHandlerCtx,
): void {
  const en = ev.removedEntity;
  if (en.typeId !== "minecraft:item" || en.hasTag("fakeItem")) return;

  // Skip bundle / inventory-holding items — they manage their own removal cycle
  // (right-clicking a bundle removes+respawns it; intercepting that breaks the UI)
  const rawItemComp = en.getComponent("item") as
    | { itemStack?: { hasComponent: (id: string) => boolean } }
    | undefined;
  if (
    rawItemComp?.itemStack?.hasComponent("minecraft:bundle") ||
    rawItemComp?.itemStack?.hasComponent("minecraft:inventory")
  ) return;

  // Item was pending stacking — it was removed before we could process it.
  if (ctx.pendingStack.has(en.id)) {
    ctx.pendingStack.delete(en.id);
    return;
  }

  const itemData = ctx.stackData.get(en.id) ?? ctx.dimensionBackup.get(en.id);
  if (!itemData) return;

  const loc = { x: en.location.x, y: en.location.y, z: en.location.z };
  const dimId = en.dimension.id;

  const itemTypeId = itemData.typeId;
  const itemMaxAmount = itemData.maxAmount;

  // Skip items standing inside a portal — they are dimension-transferring,
  // not being destroyed. Let them teleport safely; data is preserved in stackData.
  try {
    const block = en.dimension.getBlock(loc);
    if (block && PORTAL_BLOCK_IDS.has(block.typeId)) return;
  } catch { /* chunk not loaded — ignore */ }

  // Defer to main tick to bypass BeforeEvent Restricted Execution mode.
  system.run(() => {
    ctx.adapter.deStack(
      en.id,
      loc,
      dimId,
      itemTypeId,
      1, // itemAmount is irrelevant as it's immediately overwritten
      itemMaxAmount,
      ctx.rendering,
      ctx.stackData,
      ctx.dimensionBackup,
      ctx.pendingStack,
    );
  });
}
