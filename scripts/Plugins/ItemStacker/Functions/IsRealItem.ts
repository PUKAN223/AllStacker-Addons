import { Entity } from "@minecraft/server";

export default function isRealItem(entity: Entity) {
  return entity.typeId == "minecraft:item" && !entity.hasTag("itemStacks");
}