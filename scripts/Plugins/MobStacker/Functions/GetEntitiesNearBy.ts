import { Dimension, Entity } from "@minecraft/server";
import { resetEntities } from "..";

export default function getEntitiesNearBy(dimension: Dimension, en: Entity, raduis: number = 10) {
  const allEn = dimension.getEntities({ location: en.location, maxDistance: raduis, type: en.typeId })
    .filter((x) => x.id !== en.id)
    .filter((x) => !resetEntities.has(x))
    .filter((x) => x.hasComponent("is_baby") == en.hasComponent("is_baby"))
    .filter((x) => (x.getVelocity().x + x.getVelocity().y + x.getVelocity().z) !== 0)
    .filter((x) => !x.hasComponent("is_tamed"))
    .filter((x) => !x.getComponent("leashable").leashHolder)
    .filter((x) => x.getComponent("color")?.value == en.getComponent("color")?.value)
    .filter((x) => {
      if ((x.nameTag && en.nameTag) && (x.nameTag.includes("§m§r§c") && en.nameTag.includes("§m§r§c"))) return true
      if (!(x.nameTag && en.nameTag)) return true;
      return false;
    })
  return allEn;
}