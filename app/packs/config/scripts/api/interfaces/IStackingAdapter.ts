import type { Entity } from "@minecraft/server";

/**
 * Defines whether two entities can be stacked and how to merge / split them.
 */
export interface IStackingAdapter {
  /** Returns true if source can be absorbed into target */
  canStack(source: Entity, target: Entity): boolean;
  /**
   * Merge source into target (remove source, add its amount to target).
   * Must call storage.setAmount and source.remove() inside.
   */
  merge(source: Entity, target: Entity): void;
  /**
   * Splits `amount` from target and returns the new entity (or null on failure).
   */
  split(target: Entity, amount: number): Entity | null;
}
