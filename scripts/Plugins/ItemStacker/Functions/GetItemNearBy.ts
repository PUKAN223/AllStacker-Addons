import { Dimension, Entity, ItemStack } from "@minecraft/server";
import isRealItem from "./IsRealItem";
import DisabledItem from "../Configs/DisabledItems";

export default function getItemNearBy(dim: Dimension, itemEn: Entity, raduis: number = 7) {
  return dim.getEntities({ location: itemEn.location, maxDistance: raduis, type: "minecraft:item", excludeTags: ["itemStacks"] })
    .filter(x => x !== itemEn)
    .filter(x => x.getComponent("item").itemStack.typeId == itemEn.getComponent("item").itemStack.typeId)
    .filter(x => !x.getComponent("item").itemStack.hasComponent("enchantable"))
    .filter(x => x.getTags().some(x => x.startsWith("amount:")))
    .filter(x => !DisabledItem.some(e => x.getComponent("item").itemStack.typeId.includes(e)));
}