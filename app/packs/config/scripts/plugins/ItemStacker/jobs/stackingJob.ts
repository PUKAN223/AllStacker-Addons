// ─── ItemStacker: Stacking Loop ────────────────────────────────────────────────

import { Entity, system } from "@minecraft/server";
import type { StackEntry } from "../types/StackEntry.ts";

export interface StackingJobCtx {
  isRunning: () => boolean;
  getPendingStack: () => Map<string, Entity>;
  getStackData: () => Map<string, StackEntry> | undefined;
  combineItemStack: (en: Entity) => void;
}

/**
 * Executes ItemStacking via system.runInterval() like the old version.
 * Runs synchronously without yielding, keeping the "Scripting Job System" graph low.
 */
export function startStackingLoop(ctx: StackingJobCtx): void {
  console.log("[ItemStacker] Stacking Loop started (Interval)");

  system.runInterval(() => {
    if (!ctx.isRunning()) return;

    try {
      const pendingStack = ctx.getPendingStack();
      if (pendingStack.size === 0) return;

      for (const [id, en] of pendingStack) {
        if (!en.isValid || en.hasTag("fakeItem")) {
          pendingStack.delete(id);
          continue;
        }
        ctx.combineItemStack(en);
      }
    } catch (e) {
      console.warn("[ItemStacker][Loop]", (e as Error).message);
    }
  }, 1); // Run every tick (fastest possible stacking, like old fast-mode)
}

/**
 * Fast-mode is now identical to the standard interval loop, as they both
 * run synchronously every tick.
 */
export function runFastModeLoop(ctx: StackingJobCtx): void {
  startStackingLoop(ctx);
}
