import { ItemStack, MinecraftDimensionTypes, system, world } from "@minecraft/server";
import Plugins from "../../Class/Plugins";
import CustomEvents from "../../Events/CustomEvent";
import { itemCode, itemList, itemStackMap, SeeingItem } from "./Configs/Databases";
import getItemAmount from "./Functions/GetItemAmount";
import isRealItem from "./Functions/IsRealItem";
import ItemsToName from "./Functions/ItemToName";
import getSizeStack from "./Functions/GetSizeStack";
import StackItem from "./Functions/GetStackItem";
import "./Commands/ResetDB";
export default class ItemStacker extends Plugins {
    constructor(name) {
        super(name);
        this.name = name;
    }
    setup() {
    }
    init() {
        system.run(StackItem);
        new CustomEvents(this.name).Tick(20, () => {
            SeeingItem.clear();
            world.getAllPlayers().forEach(pl => {
                pl.dimension.getEntities({ type: "minecraft:item", excludeTags: ["itemStacks"], location: pl.location, maxDistance: 15 }).forEach(en => {
                    SeeingItem.add(en);
                });
            });
            Object.keys(MinecraftDimensionTypes).forEach(dim => {
                world.getDimension(MinecraftDimensionTypes[dim]).getEntities({ type: "minecraft:item", excludeTags: ["itemStacks"] }).filter(x => x.getTags().some(x => x.startsWith("amount:"))).forEach(en => {
                    if (!SeeingItem.has(en)) {
                        en.nameTag = "";
                    }
                    else {
                        en.nameTag = `§e>> §c${getItemAmount(en)}§7x§r §7${ItemsToName(en)}`;
                    }
                });
            });
        });
        new CustomEvents(this.name).EntityRemoved((ev) => {
            const { removedEntity } = ev;
            if (isRealItem(removedEntity) && !itemList.has(removedEntity)) {
                const removedItemCode = itemCode.get(removedEntity.id);
                let canceled = false;
                let removedData;
                try {
                    removedData = itemStackMap.get(removedItemCode);
                }
                catch (e) {
                    removedData = [new ItemStack("minecraft:air", 1), new ItemStack("minecraft:stick", 1)];
                    canceled = true;
                }
                const removedItem = (removedData)[0];
                const realAmount = parseInt(removedData[1].nameTag);
                const removedDimension = removedEntity.dimension.id;
                const removedLocation = JSON.stringify(removedEntity.location);
                system.run(() => {
                    if (canceled)
                        return;
                    const size = getSizeStack(removedItem.amount, realAmount, removedItem.maxAmount);
                    for (let i = 0; i < size.length; i++) {
                        const items = removedItem;
                        items.amount = size[i];
                        const itemSpawn = world.getDimension(removedDimension).spawnItem(items, JSON.parse(removedLocation));
                        itemSpawn.addTag("itemStacks");
                        system.runTimeout(() => {
                            var _a, _b;
                            if (itemSpawn.isValid()) {
                                const itemSpawnDimension = itemSpawn.dimension.id;
                                const itemSpawnLocation = JSON.stringify(itemSpawn.location);
                                if (!itemSpawn.hasComponent("item"))
                                    return;
                                const itemSpawnItem = (_b = (_a = itemSpawn.getComponent("item")) === null || _a === void 0 ? void 0 : _a.itemStack) !== null && _b !== void 0 ? _b : null;
                                if (itemSpawnItem == null)
                                    return;
                                itemSpawn.remove();
                                world.getDimension(itemSpawnDimension).spawnItem(itemSpawnItem, JSON.parse(itemSpawnLocation));
                            }
                        }, 20);
                    }
                    const code = itemCode.get(removedEntity.id);
                    itemCode.delete(removedEntity.id);
                    itemStackMap.delete(code);
                });
            }
        });
        new CustomEvents(this.name).EntitySpawned((ev) => __awaiter(this, void 0, void 0, function* () {
            const { entity: addedEntity } = ev;
            if (isRealItem(addedEntity)) {
                yield system.waitTicks(5);
                if (addedEntity.isValid())
                    itemList.add(addedEntity);
            }
        }));
    }
}
//# sourceMappingURL=index.js.map