// ─── MobStacker: Stacking Loop ─────────────────────────────────────────────────

import { Entity, EntityLeashableComponent, system, world } from "@minecraft/server";
import { NameTagRenderingAdapter } from "../../../api/adapters/NameTagRenderingAdapter.ts";
import type { IEntityStorageAdapter } from "../../../api/interfaces/IEntityStorageAdapter.ts";
import type { MobStackingAdapter } from "../adapter/MobStackingAdapter.ts";
import { entityToName } from "../adapter/MobStackingAdapter.ts";
import type { ConfigProvider } from "../config/ConfigProvider.ts";
import { getCfgArr, getCfgNum, getCfgStr } from "../config/helpers.ts";

export interface MobStackingJobCtx {
  isRunning: () => boolean;
  plugin: ConfigProvider;
  getStorage: () => IEntityStorageAdapter;
  getAdapter: () => MobStackingAdapter;
  resetEntities: Set<string>;
  jobStats: MobStackingJobStats;
}

export interface MobStackingJobStats {
  lastPassMs: number;
  entitiesScanned: number;
  entitiesMerged: number;
  lastPassTick: number;
}

function canMerge(a: Entity, b: Entity): boolean {
  if (a.hasComponent("is_tamed") || b.hasComponent("is_tamed")) return false;
  if (a.hasComponent("is_baby") !== b.hasComponent("is_baby")) return false;
  const aL = a.getComponent(EntityLeashableComponent.componentId) as EntityLeashableComponent | undefined;
  const bL = b.getComponent(EntityLeashableComponent.componentId) as EntityLeashableComponent | undefined;
  if ((aL?.leashHolder) || (bL?.leashHolder)) return false;
  if (a.getComponent("color")?.value !== b.getComponent("color")?.value) return false;
  return true;
}

/**
 * Executes MobStacking via system.runInterval() like the old version.
 * Runs synchronously without yielding, keeping the "Scripting Job System" graph low.
 */
export function startStackingLoop(ctx: MobStackingJobCtx): void {
  console.log("[MobStacker] Loop started (Interval)");

  system.runInterval(() => {
    if (!ctx.isRunning()) return;

    const tickStart = Date.now();
    let passScanned = 0;
    let passMerged = 0;

    try {
      const stackList = getCfgArr(ctx.plugin, "StackMob");
      const radius = getCfgNum(ctx.plugin, "RadiusStacking", 10);
      const radiusSq = radius * radius;
      const displayText = getCfgStr(ctx.plugin, "DisplayText", "§7§c§l%a §r%n§r");
      const stackSet = new Set(stackList);
      const renderer = new NameTagRenderingAdapter(displayText);
      const storage = ctx.getStorage();
      const adapter = ctx.getAdapter();

      // ONE getEntities per dimension
      for (const dimId of ["overworld", "nether", "the_end"] as const) {
        let allEntities: Entity[];
        try { allEntities = world.getDimension(dimId).getEntities(); }
        catch { continue; }

        const byType = new Map<string, Entity[]>();
        for (const en of allEntities) {
          if (!stackSet.has(en.typeId) || ctx.resetEntities.has(en.id) || !en.isValid) continue;
          const bucket = byType.get(en.typeId);
          if (bucket) bucket.push(en);
          else byType.set(en.typeId, [en]);
        }

        for (const [, entities] of byType) {
          const absorbed = new Set<string>();

          for (const entity of entities) {
            if (!entity.isValid || absorbed.has(entity.id)) continue;
            passScanned++;

            const ex = entity.location.x;
            const ey = entity.location.y;
            const ez = entity.location.z;
            const eAmt = storage.getAmount(entity);

            const near = entities.filter((t) => {
              if (t.id === entity.id || !t.isValid || absorbed.has(t.id)) return false;
              if (ctx.resetEntities.has(t.id)) return false;
              const dx = t.location.x - ex;
              const dy = t.location.y - ey;
              const dz = t.location.z - ez;
              if (dx * dx + dy * dy + dz * dz > radiusSq) return false;
              return canMerge(entity, t);
            });

            if (near.length === 0) {
              if (eAmt > 1 && !entity.nameTag) {
                renderer.updateDisplay(entity, eAmt, entityToName(entity));
              }
            } else {
              let mergedAmt = 0;
              for (const target of near) {
                if (!target.isValid) continue;
                const tAmt = storage.getAmount(target);
                if (tAmt > eAmt) continue;
                target.dimension.spawnParticle("minecraft:large_explosion", {
                  x: target.location.x, y: target.location.y + 0.5, z: target.location.z,
                });
                mergedAmt += tAmt;
                passMerged++;
                absorbed.add(target.id);
                adapter.merge(target, entity);
              }
              if (mergedAmt > 0) {
                renderer.updateDisplay(entity, storage.getAmount(entity), entityToName(entity));
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("[MobStacker][Loop]", (e as Error).message);
    }

    ctx.jobStats.lastPassMs = Date.now() - tickStart;
    ctx.jobStats.entitiesScanned = passScanned;
    ctx.jobStats.entitiesMerged = passMerged;
    ctx.jobStats.lastPassTick = system.currentTick;
  }, 20); // Runs every 20 ticks (1 second) like old behaviour
}
