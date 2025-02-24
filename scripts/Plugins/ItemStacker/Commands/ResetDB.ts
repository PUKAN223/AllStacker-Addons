import { ChatSendBeforeEvent, system } from "@minecraft/server"
import { itemCode, itemStackMap } from "../Configs/Databases"
import CommandBuilder, { commands } from "../../../Class/CommandBuilders"

new CommandBuilder(
  "resetDB",
  "Use this command to reset Database of ItemStack",
  "!",
  (pl) => {
    return pl.isOp()
  }
).overload((pl) => {
  itemCode.clear()
  itemStackMap.keys().forEach(m => {
    itemStackMap.set(m, [])
    itemStackMap.delete(m)
  })
  itemStackMap.clear()
})