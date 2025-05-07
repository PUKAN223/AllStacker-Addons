export default function getItemAmount(entity) {
    var _a;
    if (entity.isValid)
        return (_a = parseInt(entity.getTags().find(x => x.startsWith("amount:")).split(":")[1])) !== null && _a !== void 0 ? _a : entity.getComponent("item").itemStack.amount;
    return 1;
}
//# sourceMappingURL=GetItemAmount.js.map