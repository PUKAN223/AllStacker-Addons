import { system, world } from "@minecraft/server";
import { DisplayText, isLoaded, itemStackData } from "../Configs/Database";
import ItemsToName from "./ItemToName";
import { getTimeRemaining } from "./GetTimeRemianing";
export function* SeeingItem() {
    const ListStack = [...itemStackData.keys()];
    for (const pl of world.getAllPlayers()) {
        const allEnititys = pl.dimension.getEntities({ type: "minecraft:item" }).filter(x => ListStack.some(d => d == x.id));
        const filterEntitys = pl.dimension.getEntities({ maxDistance: 15, location: pl.location, type: "minecraft:item" }).filter(x => ListStack.some(d => d == x.id));
        for (const en of filterEntitys) {
            const itemData = itemStackData.get(en.id);
            if (itemData && en.isValid && isLoaded) {
                const timeData = getTimeRemaining(5, 30, itemData.life);
                let text = DisplayText.get("itemStack");
                text = text.replace(/%a/g, `${itemData.amount}`);
                text = text.replace(/%n/g, ItemsToName(en));
                text = text.replace(/%m/g, `${Math.max(timeData.m, 0)}`);
                text = text.replace(/%s/g, `${timeData.s}`);
                en.nameTag = text;
            }
            yield;
        }
        for (const en of allEnititys) {
            const itemData = itemStackData.get(en.id);
            if (itemData && en.isValid) {
                const timeData = getTimeRemaining(5, 30, itemData.life);
                if (timeData.m < 0) {
                    itemStackData.delete(en.id);
                    en.addTag("fakeItem");
                    en.remove();
                }
                else if (system.currentTick % 20 == 0)
                    en.nameTag = ``;
                yield;
            }
        }
        yield;
    }
    system.runJob(SeeingItem());
}
//# sourceMappingURL=SeeingItem.js.map