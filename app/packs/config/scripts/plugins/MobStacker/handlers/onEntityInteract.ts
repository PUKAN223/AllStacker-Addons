// ─── MobStacker › handlers › onEntityInteract ───────────────────────────────

import { PlayerInteractWithEntityBeforeEvent, system } from "@minecraft/server";
import { NameTagRenderingAdapter } from "../../../api/adapters/NameTagRenderingAdapter.ts";
import type { IEntityStorageAdapter } from "../../../api/interfaces/IEntityStorageAdapter.ts";
import {
  entityToName,
  spawnEntityClone,
} from "../adapter/MobStackingAdapter.ts";
import type { ConfigProvider } from "../config/ConfigProvider.ts";
import { getCfgArr, getCfgBool, getCfgStr } from "../config/helpers.ts";

const BREEDING_FOODS: Record<string, string[]> = {
  "minecraft:cow": ["minecraft:wheat"],
  "minecraft:mooshroom": ["minecraft:wheat"],
  "minecraft:sheep": ["minecraft:wheat"],
  "minecraft:pig": [
    "minecraft:carrot",
    "minecraft:potato",
    "minecraft:beetroot",
  ],
  "minecraft:chicken": [
    "minecraft:wheat_seeds",
    "minecraft:pumpkin_seeds",
    "minecraft:melon_seeds",
    "minecraft:beetroot_seeds",
    "minecraft:torchflower_seeds",
    "minecraft:pitcher_pod",
  ],
};

export interface InteractCtx {
  storage: IEntityStorageAdapter;
  plugin: ConfigProvider;
  resetEntities: Set<string>;
}

/**
 * Fired before a player interacts with an entity.
 * If the entity is a stacked mob, this splits off 1 mob for the player
 * to interact with (e.g., shearing a sheep, milking a cow, naming).
 */
export function onEntityInteract(
  ev: PlayerInteractWithEntityBeforeEvent,
  ctx: InteractCtx,
): void {
  const amount = ctx.storage.getAmount(ev.target);
  if (amount <= 1) return;
  if (!getCfgArr(ctx.plugin, "StackMob").includes(ev.target.typeId)) return;

  const typeId = ev.target.typeId;
  const massBreeding = getCfgBool(ctx.plugin, "MassBreeding", true);
  const displayText = getCfgStr(ctx.plugin, "DisplayText", "§7§c§l%a §r%n§r");

  // Mass Breeding Check
  if (massBreeding && BREEDING_FOODS[typeId]) {
    const equipComp = ev.player.getComponent(
      "equippable",
    ) as import("@minecraft/server").EntityEquippableComponent;
    if (equipComp) {
      const heldItem = equipComp.getEquipment(
        "Mainhand" as import("@minecraft/server").EquipmentSlot,
      );
      if (heldItem && BREEDING_FOODS[typeId].includes(heldItem.typeId)) {
        ev.cancel = true; // Prevent default interaction ALWAYS

        // Check cooldown
        const cd = ev.target.getDynamicProperty("massBreedCooldown");
        if (typeof cd === "number" && system.currentTick < cd) {
          // Still on cooldown
          return;
        }

        system.run(() => {
          if (!ev.target.isValid) return;
          const currentAmount = ctx.storage.getAmount(ev.target);
          const foodAmount = heldItem.amount;

          const fedAdults = Math.min(currentAmount, foodAmount);
          const pairs = Math.floor(fedAdults / 2);

          if (pairs > 0) {
            // Deduct food
            if (foodAmount === pairs * 2) {
              equipComp.setEquipment(
                "Mainhand" as import("@minecraft/server").EquipmentSlot,
                undefined,
              );
            } else {
              heldItem.amount -= pairs * 2;
              equipComp.setEquipment(
                "Mainhand" as import("@minecraft/server").EquipmentSlot,
                heldItem,
              );
            }

            // Spawn baby stack
            const baby = ev.target.dimension.spawnEntity(
              typeId,
              ev.target.location,
            );

            try {
              baby.triggerEvent("minecraft:entity_born");
            } catch { /* ok */ }

            ctx.storage.setAmount(baby, pairs);
            const rendering = new NameTagRenderingAdapter(displayText);
            if (pairs > 1) {
              rendering.updateDisplay(baby, pairs, entityToName(baby));
            } else {
              rendering.clearDisplay(baby);
            }

            // Prevent baby stack from despawning (no setPersistence in Bedrock Script API).
            if (!baby.nameTag) baby.nameTag = "\u200B"; // zero-width space

            // Spawn XP
            const xpAmount = pairs * 3;
            ev.player.addExperience(xpAmount);

            // Particles and Sound
            ev.target.dimension.spawnParticle("minecraft:heart_particle", {
              x: ev.target.location.x,
              y: ev.target.location.y + 1,
              z: ev.target.location.z,
            });

            // Apply 5 minute cooldown (6000 ticks) to the entire stack
            ev.target.setDynamicProperty(
              "massBreedCooldown",
              system.currentTick + 6000,
            );
            // Prevent parent stack from despawning.
            if (!ev.target.nameTag) ev.target.nameTag = "\u200B"; // zero-width space

            // Interaction cooldown for the mob
            ctx.resetEntities.add(ev.target.id);
            system.runTimeout(
              () => ctx.resetEntities.delete(ev.target.id),
              200,
            );
          }
        });
        return; // Exit here, do not perform normal split
      }
    }
  }

  system.run(() => {
    if (!ev.target.isValid) return;
    const remaining = amount - 1;
    const clone = spawnEntityClone(ev.target);
    const rendering = new NameTagRenderingAdapter(displayText);

    // Give remaining stack amount to clone
    ctx.storage.setAmount(clone, remaining);
    if (remaining > 1) {
      rendering.updateDisplay(clone, remaining, entityToName(clone));
    } else {
      rendering.clearDisplay(clone);
    }

    // Target being interacted with becomes amount=1
    ctx.storage.setAmount(ev.target, 1);
    rendering.clearDisplay(ev.target);

    // Prevent immediate re-stacking during interaction
    ctx.resetEntities.add(ev.target.id);
    system.runTimeout(() => ctx.resetEntities.delete(ev.target.id), 200);
  });
}
