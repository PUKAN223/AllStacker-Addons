import { Dimension, Entity, EntityIsBabyComponent, EntityLeashableComponent, EntityScaleComponent, system, world } from "@minecraft/server";
import { getAllEntities, getEntitiesAtDim } from "../../../../core/utils/EntityManagers";
import { IConfigMobStacker } from "..";

export function* StackingMob(config: IConfigMobStacker): Generator<void> {
  new Promise<void>(async (resolve) => {
    try {
      const allEntities = getAllEntities((en) => {
        if (
          !config.ResetEntities.has(en) &&
          [...config.MobStackConfig.get("StackMob") as string[] || []].some(b => b === en.typeId) &&
          en.location
        ) return true;
        return false;
      })
      // console.info(`StackingMob: Found ${allEntities.length} entities to stack.`);

      for (const entity of allEntities) {
        let removedAmount = 0;
        if (!entity.isValid) continue;
        const nearEntities = getEntitiesNearBy(entity.dimension, entity, config);
        // console.info(`StackingMob: Found ${nearEntities.length} entities near ${entity.typeId} at ${entity.location.x}, ${entity.location.y}, ${entity.location.z}.`);
        if (!nearEntities || nearEntities.length === 0) {
          continue;
        }
        for (const target of nearEntities) {
          const amount = target.getDynamicProperty("StackingAmount") as number || 1;
          target.dimension.spawnParticle("minecraft:large_explosion", { ...target.location, y: target.location.y + 0.5 })
          target.remove();
          removedAmount += amount
        }
        const currAmount = entity.getDynamicProperty("StackingAmount") as number || 1;
        const displayText = config.MobStackConfig.get("DisplayText") || "§7§c§l%a §r%n§r";

        entity.setDynamicProperty("StackingAmount", removedAmount + currAmount);

        let text = displayText;
        text = `§e ` + text
        text = text.replace(/%a/g, `${getMobColorCode(removedAmount + currAmount)}x${removedAmount + currAmount}§r`)
        text = text.replace(/%n/g, EntityToName(entity))
        text = text.replace(/%l/g, "\n")
        entity.nameTag = text;
      }

      await system.waitTicks(20);
      resolve();
    } catch (error) {
      system.runTimeout(() => {
        StackingMob(config);
      }, 20)
    }
  }).finally(() => {
    system.runJob(StackingMob(config));
  })
}

export function EntityToName(en: Entity) {
  return en.typeId.split(":")[1]
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getEntitiesNearBy(dimension: Dimension, en: Entity, config: IConfigMobStacker) {
  const radiusStacking = config.MobStackConfig.get("RadiusStacking") || 10;

  const allEn = dimension.getEntities({ location: en.location, maxDistance: radiusStacking, type: en.typeId })
    .filter((x) => x.id !== en.id)
    .filter((x) => !config.ResetEntities.has(x))
    .filter((x) => x.hasComponent("is_baby") == en.hasComponent("is_baby"))
    .filter((x) => !x.hasComponent("is_tamed"))
    .filter((x) => {
      if (x.hasComponent(EntityLeashableComponent.componentId)) {
        const leashable = x.getComponent(EntityLeashableComponent.componentId);
        if (leashable.leashHolder) return false;
      }
      return true;
    })
    .filter((x) => x.getComponent("color")?.value == en.getComponent("color")?.value)
    .filter((x) => {
      const isHasStackEn = x.getDynamicProperty("StackingAmount");
      const isHasStackTarget = en.getDynamicProperty("StackingAmount");
      if (isHasStackEn && isHasStackTarget) return true;
      if (!(isHasStackEn && isHasStackTarget)) return true;
      return false;
    })
    .filter((x) => {
      if (!x.hasComponent(EntityScaleComponent.componentId)) return true;
      if (x.getComponent(EntityScaleComponent.componentId).value !== en.getComponent(EntityScaleComponent.componentId).value) return false;
    })
  return allEn;
}

export function getMobColorCode(amount: number) {
  if (amount >= 1290) return "§9";
  if (amount >= 960) return "§b";
  if (amount >= 390) return "§a";
  if (amount >= 108) return "§e";
  if (amount >= 88) return "§g";
  if (amount >= 68) return "§p";
  if (amount >= 48) return "§6";
  if (amount >= 18) return "§v";
  return "§c";
}

export function spawnEntityClone(en: Entity) {
  const entityNew = en.dimension.spawnEntity(en.typeId, en.location)
  if (entityNew.hasComponent("color")) {
    entityNew.getComponent("color").value = en.getComponent("color").value
  }
  if (en.hasComponent(EntityIsBabyComponent.componentId)) {
    try {
      entityNew.triggerEvent("minecraft:entity_born")
    } catch { }
  } else {
    try {
      entityNew.triggerEvent("minecraft:ageable_grow_up")
    } catch { }
  }

  return entityNew
}