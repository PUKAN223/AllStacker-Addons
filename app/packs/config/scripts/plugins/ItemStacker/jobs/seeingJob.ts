// ─── ItemStacker: Seeing / Name-tag Loop ─────────────────────────────────────

import { Entity, system, world } from "@minecraft/server";
import type { StackEntry } from "../types/StackEntry.ts";
import type { IRenderingAdapter } from "../../../api/interfaces/IRenderingAdapter.ts";
import { getCfgNum, getCfgStr } from "../config/helpers.ts";
import type { ConfigProvider } from "../config/ConfigProvider.ts";
import { getColorCode } from "../../../api/adapters/NameTagRenderingAdapter.ts";
import { getTimeRemaining, itemEntityName } from "../utils.ts";

export interface SeeingJobCtx {
  isRunning: () => boolean;
  getStackData: () => Map<string, StackEntry> | undefined;
  getRendering: () => IRenderingAdapter;
  plugin: ConfigProvider;
}

/**
 * Executes SeeingJob via system.runInterval() like the old version.
 * Runs synchronously without yielding, keeping the "Scripting Job System" graph low.
 */
export function startSeeingLoop(ctx: SeeingJobCtx): void {
  console.log("[ItemStacker] Seeing Loop started (Interval)");

  system.runInterval(() => {
    if (!ctx.isRunning()) return;

    try {
      const stackData = ctx.getStackData();
      if (!stackData || stackData.size === 0) return;

      const radiusSeeing = getCfgNum(ctx.plugin, "RadiusSeeing", 10);
      const radiusSq = radiusSeeing * radiusSeeing;
      const displayText = getCfgStr(ctx.plugin, "DisplayText", "§7§c§l%a §r%n§r");
      const players = world.getAllPlayers();

      // ONE getEntities per dimension
      const byDim = new Map<string, Map<string, Entity>>();
      for (const [, data] of stackData) {
        if (!byDim.has(data.dimId)) {
          try {
            const entities = world
              .getDimension(data.dimId as "overworld")
              .getEntities({ type: "minecraft:item" });
            const lookup = new Map<string, Entity>();
            for (const e of entities) lookup.set(e.id, e);
            byDim.set(data.dimId, lookup);
          } catch { byDim.set(data.dimId, new Map()); }
        }
      }

      for (const [id, data] of stackData) {
        const en = byDim.get(data.dimId)?.get(id);
        if (!en || !en.isValid) continue;

        const timeData = getTimeRemaining(5, 30, data.lifeTick);

        if (timeData.m < 0) {
          stackData.delete(id);
          en.addTag("fakeItem");
          en.remove();
        } else {
          const ex = en.location.x;
          const ey = en.location.y;
          const ez = en.location.z;
          const near = players.find((p) => {
            if (p.dimension.id !== data.dimId) return false;
            const dx = p.location.x - ex;
            const dy = p.location.y - ey;
            const dz = p.location.z - ez;
            return dx * dx + dy * dy + dz * dz <= radiusSq;
          });

          if (!near) {
            ctx.getRendering().clearDisplay(en);
          } else {
            const name = itemEntityName(en);
            let text = "§e " + displayText;
            text = text.replace(/%a/g, `${getColorCode(data.logicalTotal)}x${data.logicalTotal}§r`);
            text = text.replace(/%n/g, name);
            text = text.replace(/%m/g, `${Math.max(timeData.m, 0)}`);
            text = text.replace(/%s/g, `${timeData.s}`);
            text = text.replace(/%l/g, "\n");
            en.nameTag = text;
          }
        }
      }
    } catch (e) {
      console.warn("[ItemStacker][Loop]", (e as Error).message);
    }
  }, 5); // Run every 5 ticks (~4 times per sec)
}
