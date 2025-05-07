import { system, world } from "@minecraft/server";
import { ItemListStack, itemStackData, UnStackItem } from "../Configs/Database";
import getItemNearBy from "./GetItemNearBy";
export function* StackingItem() {
    if (system.currentTick % 2 !== 0) {
        for (const en of ItemListStack) {
            if (!en.isValid())
                continue;
            const item = en.getComponent("item").itemStack;
            let totalAmount = 0;
            if (!(item.nameTag || item.typeId.includes("potion") || ([...UnStackItem.keys()].some(x => x == item.typeId)))) {
                for (const target of getItemNearBy(en)) {
                    totalAmount += itemStackData.get(target.id).amount;
                    if (itemStackData.has(target.id))
                        itemStackData.delete(target.id);
                    if (ItemListStack.has(target))
                        ItemListStack.delete(target);
                    target.addTag("fakeItem");
                    target.remove();
                }
            }
            itemStackData.set(en.id, { amount: totalAmount + item.amount, item: item, life: system.currentTick, currAmount: totalAmount });
            ItemListStack.delete(en);
            yield;
        }
    }
    else {
        for (const enData of itemStackData) {
            const en = world.getDimension("overworld").getEntities().filter(x => x.id == enData[0])[0];
            if (en && en.isValid()) {
                const data = itemStackData.get(en.id);
                const item = en.getComponent("item").itemStack;
                itemStackData.set(en.id, { amount: data.currAmount + item.amount, item: data.item, life: data.life, currAmount: data.currAmount });
            }
            yield;
        }
    }
    system.run(() => system.runJob(StackingItem()));
}
//# sourceMappingURL=GetStackItem.js.map