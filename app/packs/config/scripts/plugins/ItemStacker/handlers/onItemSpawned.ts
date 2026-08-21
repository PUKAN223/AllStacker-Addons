// ─── ItemStacker: onItemSpawned Handler ──────────────────────────────────────

import { Entity, EntitySpawnAfterEvent } from "@minecraft/server";
import type { StackEntry } from "../types/StackEntry.ts";

export interface SpawnedHandlerCtx {
  /** id → entity reference so stackingJob never needs to call getEntities to find pending items. */
  pendingStack: Map<string, Entity>;
  stackData: Map<string, StackEntry>;
}

/**
 * Fired after any entity spawns.
 * Stores entity reference (not just id) so the stacking job can process it
 * without calling getEntities() to locate it again.
 */
export function onItemSpawned(
  ev: EntitySpawnAfterEvent,
  ctx: SpawnedHandlerCtx,
): void {
  const en = ev.entity;
  if (!en.isValid || en.typeId !== "minecraft:item" || en.hasTag("fakeItem")) {
    return;
  }
  // Skip if already tracked (e.g. restored from DynamicProperty after /reload)
  if (ctx.stackData.has(en.id)) return;
  ctx.pendingStack.set(en.id, en);
}
