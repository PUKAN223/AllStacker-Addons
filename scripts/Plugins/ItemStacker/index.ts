import { ChatSendBeforeEvent, ItemStack, MinecraftDimensionTypes, system, world } from "@minecraft/server";
import Plugins from "../../Class/Plugins";
import CustomEvents from "../../Events/CustomEvent";
import { itemCode, itemList, itemStackMap, SeeingItem } from "./Configs/Databases";
import CombineItems from "./Functions/CombineItems";
import getItemAmount from "./Functions/GetItemAmount";
import isRealItem from "./Functions/IsRealItem";
import randomCode from "./Functions/RandomCode";
import ItemsToName from "./Functions/ItemToName";
import getSizeStack from "./Functions/GetSizeStack";
import StackItem from "./Functions/GetStackItem";

export default class ItemStacker extends Plugins {
  private name: string
  constructor(name: string) {
    super(name)
    this.name = name
  }

  public setup(): void {
  }

  public init(): void {
    world.beforeEvents.chatSend.subscribe(resetDB)
    function resetDB(ev: ChatSendBeforeEvent) {
      if (ev.message == "!resetDB") {
        ev.cancel = true
        system.run(() => {
          itemCode.clear()
          itemStackMap.keys().forEach(m => {
            itemStackMap.set(m, [])
            itemStackMap.delete(m)
          })
          itemStackMap.clear()
        })
      }
    }

    StackItem()

    new CustomEvents(this.name).Tick(20, () => {
      SeeingItem.clear();
      world.getAllPlayers().forEach(pl => {
        pl.dimension.getEntities({ type: "minecraft:item", excludeTags: ["itemStacks"], location: pl.location, maxDistance: 15 }).forEach(en => {
          SeeingItem.add(en);
        });
      });
      Object.keys(MinecraftDimensionTypes).forEach(dim => {
        world.getDimension(MinecraftDimensionTypes[dim as "nether"]).getEntities({ type: "minecraft:item", excludeTags: ["itemStacks"] }).filter(x => x.getTags().some(x => x.startsWith("amount:"))).forEach(en => {
          if (!SeeingItem.has(en)) {
            en.nameTag = "";
          }
          else {
            en.nameTag = `§e>> §c${getItemAmount(en)}§7x§r §7${ItemsToName(en)}`;
          }
        });
      });
    })

    new CustomEvents(this.name).EntityRemoved((ev) => {
      const { removedEntity } = ev;
      if (isRealItem(removedEntity) && !itemList.has(removedEntity)) {
        const removedItemCode = itemCode.get(removedEntity.id)
        let canceled = false;
        let removedData;
        try {
          removedData = (itemStackMap.get(removedItemCode) as ItemStack[])
        } catch(e) {
          removedData = [new ItemStack("minecraft:air", 1), new ItemStack("minecraft:stick", 1)]
          canceled = true 
        }
        const removedItem = (removedData)[0]
        const realAmount = parseInt(removedData[1].nameTag)
        const removedDimension = removedEntity.dimension.id;
        const removedLocation = JSON.stringify(removedEntity.location);
        system.run(() => {
          if (canceled) return;
          const size = getSizeStack(removedItem.amount, realAmount, removedItem.maxAmount);
          for (let i = 0; i < size.length; i++) {
            const items = removedItem;
            items.amount = size[i];
            const itemSpawn = world.getDimension(removedDimension).spawnItem(items, JSON.parse(removedLocation));
            itemSpawn.addTag("itemStacks");
            system.runTimeout(() => {
              if (itemSpawn.isValid()) {
                const itemSpawnDimension = itemSpawn.dimension.id;
                const itemSpawnLocation = JSON.stringify(itemSpawn.location);
                if (!itemSpawn.hasComponent("item")) return
                const itemSpawnItem = itemSpawn.getComponent("item")?.itemStack ?? null;
                if (itemSpawnItem == null) return
                itemSpawn.remove();
                world.getDimension(itemSpawnDimension).spawnItem(itemSpawnItem, JSON.parse(itemSpawnLocation));
              }
            }, 20);
          }
          const code = itemCode.get(removedEntity.id)
          itemCode.delete(removedEntity.id)
          itemStackMap.delete(code);
        });
      }
    })

    new CustomEvents(this.name).EntitySpawned(async (ev) => {
      const { entity: addedEntity } = ev;
      if (isRealItem(addedEntity)) {
        await system.waitTicks(5)
        if (addedEntity.isValid()) itemList.add(addedEntity);
      }
    })
  }
}