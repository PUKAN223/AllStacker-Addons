// ─── Job Debug: Actionbar Live Stats ─────────────────────────────────────────
//
// Displays per-tick job performance stats on the actionbar of OP players
// who have toggled debug mode on (via /tag @s add jobdebug).
//
// Activated from ConfigMenu or MobStacker/ItemStacker index.
// ─────────────────────────────────────────────────────────────────────────────

import { system, world } from "@minecraft/server";
import type { MobStackingJobStats } from "../MobStacker/jobs/stackingJob.ts";

export interface JobDebugSources {
  isRunning: () => boolean;
  getItemStats: () => { trackedItems: number; pendingItems: number } | null;
  getMobStats: () => (MobStackingJobStats & { scanned: number; merged: number }) | null;
}

/** Colors a millisecond value: green <5ms, yellow <15ms, red ≥15ms */
function msColor(ms: number): string {
  if (ms < 5) return `§a${ms}ms§r`;
  if (ms < 15) return `§e${ms}ms§r`;
  return `§c${ms}ms§r`;
}

/**
 * Starts a recurring loop (once per second) that writes live job stats
 * to the actionbar of any OP player who has the "jobdebug" tag.
 *
 * Add the tag with: /tag @s add jobdebug
 * Remove with:      /tag @s remove jobdebug
 */
export function startJobDebugLoop(sources: JobDebugSources): void {
  const tick = () => {
    if (sources.isRunning() && system.currentTick % 20 === 0) {
      const debugPlayers = world.getAllPlayers().filter((p) => p.hasTag("jobdebug"));

      if (debugPlayers.length > 0) {
        const itemStats = sources.getItemStats();
        const mobStats = sources.getMobStats();

        const parts: string[] = ["§8[§bJobDebug§8]§r"];

        if (itemStats) {
          parts.push(
            `§7Item§8:§r tracked§f${itemStats.trackedItems}§r pend§f${itemStats.pendingItems}§r`,
          );
        }

        if (mobStats) {
          parts.push(
            `§7Mob§8:§r ${msColor(mobStats.lastPassMs)} scan§f${mobStats.entitiesScanned}§r mrg§f${mobStats.entitiesMerged}§r`,
          );
        }

        const bar = parts.join(" §8|§r ");
        for (const pl of debugPlayers) {
          pl.onScreenDisplay.setActionBar(bar);
        }
      }
    }

    system.run(tick);
  };

  system.run(tick);
}
