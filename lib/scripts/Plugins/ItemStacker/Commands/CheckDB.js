import CommandBuilder from "../../../Class/CommandBuilders";
import { ItemListStack, itemStackData } from "../Configs/Database";
new CommandBuilder("checkDB", "Use this command to check database of ItemStack", "!", (pl) => {
    return pl.isOp();
}).overload((pl) => {
    pl.sendMessage(`data: ${itemStackData.size}\nlist: ${ItemListStack.size}`);
});
//# sourceMappingURL=CheckDB.js.map