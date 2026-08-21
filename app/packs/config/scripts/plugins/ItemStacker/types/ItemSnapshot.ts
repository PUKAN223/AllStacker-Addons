// ─── ItemStacker › types › ItemSnapshot ──────────────────────────────────────

/**
 * Primitive snapshot of an {@link ItemStack} captured inside a Before-event.
 *
 * Bedrock's ScriptAPI invalidates live `ItemStack` object references as soon as
 * the entity is consumed (hopper, fire, etc.), which happens synchronously before
 * any `system.run()` callback fires.  Snapshotting these primitives immediately
 * ensures the deStack logic always has valid data.
 */
export interface ItemSnapshot {
  /** e.g. `"minecraft:diamond"` */
  typeId: string;
  /** Current physical amount on the entity. */
  amount: number;
  /** Maximum stack size for this item type (used to chunk remainder spawns). */
  maxAmount: number;
}
