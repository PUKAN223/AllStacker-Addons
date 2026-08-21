// ─── MobStacker › handlers › onXpDrop ─────────────────────────────────────────

import { EntityRemoveBeforeEvent, system, world } from "@minecraft/server";

export interface XpDropCtx {
  xpQueue: Map<string, number>;
}

/**
 * Fired when an entity is removed from the world.
 * If the entity was a stacked mob that died and dropped XP, this handler
 * multiplies the dropped XP orb by the stack's remaining amount.
 */
export function onXpDrop(ev: EntityRemoveBeforeEvent, ctx: XpDropCtx): void {
  const saved = {
    id: ev.removedEntity.id,
    location: {
      x: ev.removedEntity.location.x,
      y: ev.removedEntity.location.y,
      z: ev.removedEntity.location.z,
    },
    dimId: ev.removedEntity.dimension.id,
  };
  
  system.run(() => {
    if (!ctx.xpQueue.has(saved.id)) return;
    const xpCount = ctx.xpQueue.get(saved.id)!;
    const dim = world.getDimension(saved.dimId as "overworld");
    
    const orbs = dim.getEntities({
      location: saved.location,
      type: "minecraft:xp_orb",
      maxDistance: 1,
      excludeTags: ["kisu:mob_stacker_xp_orb"],
    });

    for (let i = 0; i < xpCount; i++) {
      orbs.forEach((orb) => {
        if (orb.isValid) {
          const x = dim.spawnEntity("minecraft:xp_orb", orb.location);
          x.addTag("kisu:mob_stacker_xp_orb");
        }
      });
    }
    
    ctx.xpQueue.delete(saved.id);
  });
}
