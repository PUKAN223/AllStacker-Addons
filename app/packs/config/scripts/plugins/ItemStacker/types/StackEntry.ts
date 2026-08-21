// ─── ItemStacker › types › StackEntry ────────────────────────────────────────

/**
 * Persistent data for each stacked item entity.
 *
 * Stored in a {@link JsonDatabase} (world dynamic property) so logical totals
 * survive `/reload` without loss.
 */
export interface StackEntry {
  /** Total virtual item count (physical entity amount + hidden remainder). */
  logicalTotal: number;
  /** Game-tick at creation time — used to compute the item's remaining TTL. */
  lifeTick: number;
  /** Physical amount currently visible on the entity (capped at maxStack). */
  nowAmount: number;
  /** Dimension id where this item currently lives (for cross-dim lookups). */
  dimId: string;
  /** The item's type id, needed to recreate the item after hopper consume. */
  typeId: string;
  /** The item's max amount, needed to chunk the remainder. */
  maxAmount: number;
}
