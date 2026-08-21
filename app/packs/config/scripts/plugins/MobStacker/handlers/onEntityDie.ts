// ─── MobStacker › handlers › onEntityDie ──────────────────────────────────────

import {
  Entity,
  EntityDamageCause,
  EntityDieAfterEvent,
  EntityEquippableComponent,
  EntityProjectileComponent,
  EquipmentSlot,
  Player,
  world,
} from "@minecraft/server";
import { NameTagRenderingAdapter } from "../../../api/adapters/NameTagRenderingAdapter.ts";
import type { IEntityStorageAdapter } from "../../../api/interfaces/IEntityStorageAdapter.ts";
import { entityToName, spawnEntityClone } from "../adapter/MobStackingAdapter.ts";
import type { ConfigProvider } from "../config/ConfigProvider.ts";
import { getCfgArr, getCfgStr } from "../config/helpers.ts";

export interface DieCtx {
  storage: IEntityStorageAdapter;
  plugin: ConfigProvider;
  xpQueue: Map<string, number>;
}

/**
 * Drops multiplied loot for a batched portion of the stacked mob.
 */
function dropLootBatch(ev: EntityDieAfterEvent, spawnClone: Entity, count: number): void {
  const { x, y, z } = spawnClone.location;
  const isFireDamage = [
    EntityDamageCause.fire,
    EntityDamageCause.fireTick,
    EntityDamageCause.lava,
  ].includes(ev.damageSource.cause);
  const damager = ev.damageSource.damagingEntity;

  for (let i = 0; i < count; i++) {
    // Generate a short random tag to target the clone via commands.
    const randomTag = Array.from(
      { length: Math.floor(Math.random() * 13) + 1 },
      () => String.fromCharCode(
        Math.random() < 0.5
          ? Math.floor(Math.random() * 26) + 65   // A–Z
          : Math.floor(Math.random() * 26) + 97,  // a–z
      ),
    ).join("");

    spawnClone.addTag(randomTag);

    if (!damager || !damager.isValid) {
      if (isFireDamage) {
        spawnClone.dimension.runCommand(
          `loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`,
        );
      } else {
        const loot = world.getLootTableManager().generateLootFromEntity(spawnClone);
        loot?.forEach((item) => spawnClone.dimension.spawnItem(item, spawnClone.location));
      }
    } else if (damager.typeId === "minecraft:player") {
      const itemHeld = damager.hasComponent(EntityEquippableComponent.componentId)
        ? damager.getComponent(EntityEquippableComponent.componentId)!
            .getEquipment(EquipmentSlot.Mainhand)
        : null;
      if (itemHeld) {
        damager.dimension.runCommand(
          `execute as ${(damager as Player).name} at @s run loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}] mainhand`,
        );
      } else {
        const loot = world.getLootTableManager().generateLootFromEntity(spawnClone);
        loot?.forEach((item) => damager.dimension.spawnItem(item, spawnClone.location));
      }
    } else if (
      ev.damageSource.cause === EntityDamageCause.projectile &&
      ["minecraft:skeleton", "minecraft:stray", "minecraft:bogged"].includes(damager.typeId)
    ) {
      damager.addTag(randomTag + "_projectile");
      damager.runCommand(
        `execute as @e[tag=${randomTag}_projectile] at @s run loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`,
      );
    } else {
      damager.addTag(randomTag + "_entity");
      damager.dimension.runCommand(
        `execute as @e[tag=${randomTag}_entity] at @s run loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}] mainhand`,
      );
    }
  }
}

/**
 * Fired after an entity dies.
 * Handles loot drops for stacked mobs depending on the "MobDeathMode" setting.
 */
export function onEntityDie(ev: EntityDieAfterEvent, ctx: DieCtx): void {
  if (!ev.deadEntity.isValid) return;
  if (ev.deadEntity.hasComponent(EntityProjectileComponent.componentId)) return;
  if (
    ev.damageSource.cause === EntityDamageCause.none ||
    ev.damageSource.cause === EntityDamageCause.selfDestruct
  ) return;

  const currAmount = ctx.storage.getAmount(ev.deadEntity);
  if (currAmount <= 1) return;

  const stackList = getCfgArr(ctx.plugin, "StackMob");
  if (!stackList.includes(ev.deadEntity.typeId)) return;

  const configVal = ctx.plugin.config.get()?.["MobDeathMode"]?.value;
  let deathMode = "All";
  if (typeof configVal === "number") {
    deathMode = configVal === 0 ? "All" : "Only one";
  } else if (typeof configVal === "string") {
    deathMode = configVal;
  }
  const displayText = getCfgStr(ctx.plugin, "DisplayText", "§7§c§l%a §r%n§r");
  const rendering = new NameTagRenderingAdapter(displayText);

  if (deathMode === "All") {
    // Drop loot for all stacked mobs (batched to prevent lag)
    const batchSize = 32;
    const spawnClone = spawnEntityClone(ev.deadEntity);
    const dropCount = Math.min(currAmount - 1, batchSize - 1);
    
    dropLootBatch(ev, spawnClone, dropCount);
    spawnClone.remove();

    if (currAmount > batchSize) {
      // Re-spawn the remaining mobs that didn't die in this batch
      const entityNew = spawnEntityClone(ev.deadEntity);
      const surviving = currAmount - batchSize;
      ctx.storage.setAmount(entityNew, surviving);
      rendering.updateDisplay(entityNew, surviving, entityToName(entityNew));
      ctx.xpQueue.set(ev.deadEntity.id, batchSize - 1);
    } else {
      // All mobs died
      ctx.xpQueue.set(ev.deadEntity.id, currAmount - 1);
    }
  } else {
    // "Only one" mode — just drop loot for 1 mob and preserve the rest
    if (currAmount - 1 <= 0) return;
    const entityNew = spawnEntityClone(ev.deadEntity);
    const surviving = currAmount - 1;
    if (surviving <= 1) return;
    
    ctx.storage.setAmount(entityNew, surviving);
    rendering.updateDisplay(entityNew, surviving, entityToName(entityNew));
  }
}
