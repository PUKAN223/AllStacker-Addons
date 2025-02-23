export default function getItemAmount(entity) {
    var _a;
    return (_a = parseInt(entity.getTags().find(x => x.startsWith("amount:")).split(":")[1])) !== null && _a !== void 0 ? _a : entity.getComponent("item").itemStack.amount;
}
//# sourceMappingURL=GetItemAmount.js.map