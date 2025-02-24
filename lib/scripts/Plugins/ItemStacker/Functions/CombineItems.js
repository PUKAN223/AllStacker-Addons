import { system } from "@minecraft/server";
import isRealItem from "./IsRealItem";
import getItemNearBy from "./GetItemNearBy";
import getItemAmount from "./GetItemAmount";
import { itemCode, itemStackMap } from "../Configs/Databases";
export default function CombineItems(entity) {
    if (isRealItem(entity)) {
        const itemNearBy = getItemNearBy(entity.dimension, entity, 10);
        const tagFound = entity.getTags().find(x => x.startsWith("amount:"));
        if (tagFound) {
            entity.removeTag(tagFound);
            entity.addTag(`amount:${itemNearBy.reduce((prev, crr) => prev + getItemAmount(crr), 0) + entity.getComponent("item").itemStack.amount}`);
        }
        else {
            entity.addTag(`amount:${itemNearBy.reduce((prev, crr) => prev + getItemAmount(crr), 0) + entity.getComponent("item").itemStack.amount}`);
        }
        itemNearBy.forEach((en) => __awaiter(this, void 0, void 0, function* () {
            en.addTag("itemStacks");
            const code = itemCode.get(en.id);
            yield system.waitTicks(1);
            itemStackMap.delete(code);
            itemCode.delete(en.id);
            en.remove();
        }));
    }
}
//# sourceMappingURL=CombineItems.js.map