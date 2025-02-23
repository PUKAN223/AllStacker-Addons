export default function ItemsToName(entity) {
    return entity.getComponent("item").itemStack.typeId
        .split(":")[1]
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
//# sourceMappingURL=ItemToName.js.map