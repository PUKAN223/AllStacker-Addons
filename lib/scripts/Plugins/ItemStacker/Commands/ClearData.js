import CommandBuilder from "../../../Class/CommandBuilders";
import { ItemListStack, itemStackData } from "../Configs/Database";
new CommandBuilder("clearDB", "Use this command to clear database of ItemStack", "!", (pl) => {
    return pl.isOp();
}).overload((pl) => {
    itemStackData.clear();
    ItemListStack.clear();
    pl.sendMessage(`data: ${itemStackData.size}\nlist: ${ItemListStack.size}`);
});
//# sourceMappingURL=ClearData.js.map