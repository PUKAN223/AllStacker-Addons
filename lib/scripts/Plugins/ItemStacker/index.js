import { ItemStack, system, world } from "@minecraft/server";
import Plugins from "../../Class/Plugins";
import CustomEvents from "../../Events/CustomEvent";
import { isLoaded, ItemListStack, itemStackData } from "./Configs/Database";
import { StackingItem } from "./Functions/GetStackItem";
import { SeeingItem } from "./Functions/SeeingItem";
import getSizeStack from "./Functions/GetSizeStack";
import { ItemConvert } from "../../Class/ItemConverter";
export default class ItemStacker extends Plugins {
    constructor(name) {
        super(name);
        this.name = name;
    }
    setup() {
        system.runJob(StackingItem());
        system.runJob(SeeingItem());
    }
    init() {
        new CustomEvents(this.name).EntitySpawned((ev) => {
            if (ev.entity.typeId === "minecraft:item" &&
                isLoaded &&
                !itemStackData.has(ev.entity.id) &&
                ev.entity.isValid() &&
                !ev.entity.hasTag("fakeItem")) {
                ItemListStack.add(ev.entity);
            }
        });
        new CustomEvents(this.name).EntityRemoved((ev) => {
            if (ev.removedEntity.typeId !== "minecraft:item" || ev.removedEntity.hasTag("fakeItem") || ItemListStack.has(ev.removedEntity))
                return;
            const location = ev.removedEntity.location;
            const dim = ev.removedEntity.dimension.id;
            const id = ev.removedEntity.id;
            system.run(() => {
                try {
                    const itemData = itemStackData.get(id);
                    if (!itemData)
                        return;
                    const itemToSpawn = itemData.amount - itemData.nowAmount;
                    if (itemToSpawn > 0) {
                        const itemStackSpawn = ItemConvert.JsonToItem(itemData.item).clone ? ItemConvert.JsonToItem(itemData.item).clone() : new ItemStack(itemData.item.typeId, itemData.item.amount);
                        itemStackSpawn.amount = itemToSpawn <= itemStackSpawn.maxAmount ? itemToSpawn : itemStackSpawn.maxAmount;
                        const itemSetData = Object.assign({}, itemData);
                        itemSetData.currAmount -= itemStackSpawn.amount;
                        itemSetData.amount -= itemStackSpawn.amount;
                        const enBase = world.getDimension(dim).spawnItem(itemStackSpawn, Object.assign(Object.assign({}, location), { y: location.y + 100 }));
                        itemStackData.set(enBase.id, itemSetData);
                        system.run(() => {
                            enBase.teleport({ x: location.x, y: location.y, z: location.z });
                        });
                    }
                    itemStackData.delete(id);
                }
                catch (e) {
                    console.warn("Hopper Detected.");
                    const itemData = itemStackData.get(id);
                    system.run(() => {
                        const itemStack = ItemConvert.JsonToItem(itemData.item);
                        const sizeStack = getSizeStack(itemData.amount - itemData.currAmount, itemData.amount, itemStack.maxAmount);
                        const itemStackSpawn = ItemConvert.JsonToItem(itemData.item).clone ? ItemConvert.JsonToItem(itemData.item).clone() : new ItemStack(itemData.item.typeId, itemData.item.amount);
                        sizeStack.forEach((item) => {
                            itemStackSpawn.amount = item;
                            const enBase = world.getDimension(dim).spawnItem(ItemConvert.JsonToItem(itemStackSpawn), location);
                            enBase.addTag("fakeItem");
                            system.runTimeout(() => {
                                if (enBase.isValid()) {
                                    ItemListStack.add(enBase);
                                }
                            }, 40);
                        });
                    });
                    itemStackData.delete(id);
                }
            });
        });
    }
}
//# sourceMappingURL=index.js.map