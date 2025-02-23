export default function isRealItem(entity) {
    return entity.typeId == "minecraft:item" && !entity.hasTag("itemStacks");
}
//# sourceMappingURL=IsRealItem.js.map