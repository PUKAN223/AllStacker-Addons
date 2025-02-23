import DisabledItem from "../Configs/DisabledItems";
export default function getItemNearBy(dim, itemEn, raduis = 7) {
    return dim.getEntities({ location: itemEn.location, maxDistance: raduis, type: "minecraft:item", excludeTags: ["itemStacks"] })
        .filter(x => x !== itemEn)
        .filter(x => x.getComponent("item").itemStack.typeId == itemEn.getComponent("item").itemStack.typeId)
        .filter(x => !x.getComponent("item").itemStack.hasComponent("enchantable"))
        .filter(x => x.getTags().some(x => x.startsWith("amount:")))
        .filter(x => !DisabledItem.some(e => x.getComponent("item").itemStack.typeId.includes(e)));
}
//# sourceMappingURL=GetItemNearBy.js.map