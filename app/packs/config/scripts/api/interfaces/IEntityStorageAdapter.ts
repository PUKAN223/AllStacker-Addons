import type { Entity } from "@minecraft/server";

/**
 * Abstracts how stacking amounts are stored per-entity.
 * Default implementation uses native DynamicProperties.
 */
export interface IEntityStorageAdapter {
  getAmount(entity: Entity): number;
  setAmount(entity: Entity, amount: number): void;
  delete(entity: Entity): void;
}
