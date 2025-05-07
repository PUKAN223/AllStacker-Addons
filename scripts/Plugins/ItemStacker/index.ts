import { Entity, ItemStack, system, world } from "@minecraft/server";
import Plugins from "../../Class/Plugins";
import CustomEvents from "../../Events/CustomEvent";
import { isLoaded, ItemListStack, itemStackData } from "./Configs/Database";
import { StackingItem } from "./Functions/GetStackItem";
import { SeeingItem } from "./Functions/SeeingItem";
import getItemAmount from "./Functions/GetItemAmount";

export default class ItemStacker extends Plugins {
  private name: string;
  constructor(name: string) {
    super(name);
    this.name = name;
  }

  public setup(): void {
    system.runJob(StackingItem());
    system.runJob(SeeingItem());
  }

  public init(): void {
    new CustomEvents(this.name).EntitySpawned((ev) => {
      if (
        ev.entity.typeId === "minecraft:item" &&
        isLoaded &&
        !itemStackData.has(ev.entity.id) &&
        ev.entity.isValid() &&
        !ev.entity.hasTag("fakeItem")
      ) {
        ItemListStack.add(ev.entity);
      }
    });

    new CustomEvents(this.name).EntityRemoved((ev) => {
      if (ev.removedEntity.typeId !== "minecraft:item" || ev.removedEntity.hasTag("fakeItem") || ItemListStack.has(ev.removedEntity)) return;
      const location = ev.removedEntity.location;
      const dim = ev.removedEntity.dimension.id;
      const id = ev.removedEntity.id;
      const itemC = ev.removedEntity.getComponent("item").itemStack
      system.run(() => {
        const itemData = itemStackData.get(id) as { amount: number, item: ItemStack, life: number, currAmount: number };
        if (!itemData) return;
        const itemToSpawn = itemData.amount - itemC.amount;
        console.log(itemToSpawn, itemData.amount, itemC.amount);
        if (itemToSpawn > 0) {
          const itemStackSpawn = itemData.item;
          if (itemToSpawn > itemData.item.maxAmount) itemStackSpawn.amount = itemData.item.maxAmount;
          else itemStackSpawn.amount = itemToSpawn;
          const itemSetData = itemData;
          itemSetData.currAmount = (itemData.currAmount - itemStackSpawn.amount);
          itemSetData.amount -= itemC.amount + itemStackSpawn.amount;
          const enBase = world.getDimension(dim).spawnItem(itemStackSpawn, location);
          enBase.teleport({ x: location.x, y: location.y, z: location.z });
          itemStackData.set(enBase.id, itemSetData);
        }
        itemStackData.delete(id);
      })
    })
  }
}