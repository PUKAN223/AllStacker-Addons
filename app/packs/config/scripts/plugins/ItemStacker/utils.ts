// ─── ItemStacker: Pure Utility Functions ─────────────────────────────────────

import { Entity, system, world } from "@minecraft/server";

/**
 * Returns a human-readable display name for an item entity.
 * Prefers the item's custom nameTag, falls back to formatted typeId.
 */
export function itemEntityName(entity: Entity): string {
  const stack = entity.getComponent("item")?.itemStack;
  if (!stack) return "Unknown";
  if (stack.nameTag) return stack.nameTag;
  return stack.typeId
    .split(":")[1]
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Computes how much time remains before an item stack expires.
 * @param minutes  Max lifetime minutes component.
 * @param seconds  Max lifetime seconds component.
 * @param referenceTick  The tick the stack was created.
 */
export function getTimeRemaining(
  minutes: number,
  seconds: number,
  referenceTick: number,
): { m: number; s: number } {
  const specifiedTicks = (minutes * 60 + seconds) * 20;
  const diff = referenceTick + specifiedTicks - system.currentTick;
  const m = Math.floor(diff / (20 * 60));
  const s = Math.floor((diff - m * 20 * 60) / 20);
  return { m, s };
}

/**
 * Splits a logical item count into physical stacks of at most `maxStack` each.
 * Mirrors the old getSizeStack() helper.
 *
 * @example getSizeStack(0, 100, 64) → [64, 36]
 */
export function getSizeStack(
  current: number,
  total: number,
  maxStack: number,
): number[] {
  const remaining = total - current;
  return [
    ...Array(Math.floor(remaining / maxStack)).fill(maxStack),
    remaining % maxStack,
  ].filter(Boolean);
}

/**
 * Finds an item entity by its unique id across all loaded dimensions.
 * Uses `dimIdHint` to search the most-likely dimension first, reducing
 * unnecessary getEntities calls from 3 to 1 in the common case.
 */
export function findEntityById(
  id: string,
  dimIdHint?: string,
): Entity | null {
  const dims = dimIdHint
    ? [
      dimIdHint,
      ...["overworld", "nether", "the_end"].filter((d) => d !== dimIdHint),
    ]
    : ["overworld", "nether", "the_end"];

  for (const dim of dims) {
    try {
      const en = world
        .getDimension(dim as "overworld")
        .getEntities({ type: "minecraft:item" })
        .find((e) => e.id === id);
      if (en) return en;
    } catch { /* dimension not loaded */ }
  }
  return null;
}
