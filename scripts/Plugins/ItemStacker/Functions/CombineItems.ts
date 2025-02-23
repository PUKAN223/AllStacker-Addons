import { Entity } from "@minecraft/server";
import isRealItem from "./IsRealItem";
import getItemNearBy from "./GetItemNearBy";
import getItemAmount from "./GetItemAmount";
import { itemCode, itemStackMap } from "../Configs/Databases";

export default function CombineItems(entity: Entity) {
  if (isRealItem(entity)) {
    const itemNearBy = getItemNearBy(entity.dimension, entity, 10);
    const tagFound = entity.getTags().find(x => x.startsWith("amount:"));
    if (tagFound) {
        entity.removeTag(tagFound);
        entity.addTag(`amount:${itemNearBy.reduce((prev, crr) => prev + getItemAmount(crr), 0) + entity.getComponent("item").itemStack.amount}`);
    } else {
        entity.addTag(`amount:${itemNearBy.reduce((prev, crr) => prev + getItemAmount(crr), 0) + entity.getComponent("item").itemStack.amount}`);
    }
    itemNearBy.forEach(en => {
        en.addTag("itemStacks");
        const code = itemCode.get(en.id)
        itemStackMap.delete(code);
        en.remove();
    });
}
}