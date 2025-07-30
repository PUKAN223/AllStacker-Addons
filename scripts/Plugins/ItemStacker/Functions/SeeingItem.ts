import { ItemEnchantableComponent, ItemStack, system, world } from "@minecraft/server";
import { DisplayText, isLoaded, ItemListStack, itemStackData } from "../Configs/Database";
import getItemNearBy from "./GetItemNearBy";
import ItemsToName from "./ItemToName";
import { getTimeRemaining } from "./GetTimeRemianing";
import { getItemColorCode } from "./GetColorCode";

export function* SeeingItem(): Generator<void, void, void> {
  const ListStack: string[] = [...itemStackData.keys()]
  for (const pl of world.getAllPlayers()) {
    const allEnititys = pl.dimension.getEntities({ type: "minecraft:item" }).filter(x => ListStack.some(d => d == x.id))
    const filterEntitys = pl.dimension.getEntities({ maxDistance: 15, location: pl.location, type: "minecraft:item" }).filter(x => ListStack.some(d => d == x.id))

    for (const en of filterEntitys) {
      const itemData = itemStackData.get(en.id) as { amount: number, item: ItemStack, life: number };
      if (itemData && en.isValid() && isLoaded) {
        const timeData = getTimeRemaining(2, 30, itemData.life)
        let text = DisplayText.get("itemStack") as string;
        text = `§e>> ` + text
        text = text.replace(/%a/g, `${getItemColorCode(itemData.amount)}x${itemData.amount}§r§i`)
        text = text.replace(/%n/g, ItemsToName(en))
        text = text.replace(/%m/g, `${Math.max(timeData.m, 0)}`)
        text = text.replace(/%s/g, `${timeData.s}`)
        en.nameTag = text;
      }
      yield;
    }

    for (const en of allEnititys) {
      const itemData = itemStackData.get(en.id) as { amount: number, item: ItemStack, life: number };
      if (itemData && en.isValid()) {
        const timeData = getTimeRemaining(2, 30, itemData.life)
        if (timeData.m < 0) {
          itemStackData.delete(en.id);
          en.addTag("fakeItem")
          en.remove()
        }
      }
    }
    yield;
  }

  system.runJob(SeeingItem())
}
