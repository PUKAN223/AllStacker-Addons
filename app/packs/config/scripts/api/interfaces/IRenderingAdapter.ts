import type { Entity } from "@minecraft/server";

/**
 * Abstracts how stacked entities are visually labelled (nameTag).
 */
export interface IRenderingAdapter {
  updateDisplay(entity: Entity, amount: number, name: string): void;
  clearDisplay(entity: Entity): void;
}
