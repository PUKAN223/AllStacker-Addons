import { Entity, EntityIsBabyComponent } from "@minecraft/server";

export default function spawnEntityClone(en: Entity) {
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