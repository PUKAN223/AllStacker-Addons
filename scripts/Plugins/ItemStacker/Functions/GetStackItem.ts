import { ItemStack, system } from "@minecraft/server"
import { itemCode, itemList, itemStackMap } from "../Configs/Databases"
import CombineItems from "./CombineItems"
import getItemAmount from "./GetItemAmount"
import randomCode from "./RandomCode"

export default async function StackItem() {
  if (itemList.size !== 0) {
    for (let addedEntity of Array.from(itemList)) {
      CombineItems(addedEntity)
      const code = randomCode(6)
      const amount = new ItemStack("minecraft:stick", 1)
      amount.nameTag = `${getItemAmount(addedEntity)}`
      itemCode.set(addedEntity.id, code)
      await system.waitTicks(1)
      itemStackMap.set(code, [addedEntity.getComponent("item").itemStack, amount])
      itemList.delete(addedEntity)
    }
  }

  if (itemList.size !== 0) {
    return StackItem()
  } else {
    system.run(StackItem)
  }
}
