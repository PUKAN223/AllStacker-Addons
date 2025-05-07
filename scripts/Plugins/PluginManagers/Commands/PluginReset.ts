import { world } from "@minecraft/server";
import CommandBuilder from "../../../Class/CommandBuilders";
import allPlugins from "../../../Configs/PluginConfigs";
import loadPlugins from "../Functions/LoadConfig";

new CommandBuilder(
  "plm-reset",
  "Use this command to reset config.",
  "!",
  (pl) => {
    return pl.isOp()
  }
).overload((pl) => {
  world.setDynamicProperty("pl-config", JSON.stringify(allPlugins(true)))
  world.getAllPlayers().forEach(pl => {
    if (pl.isOp()) {
      world.sendMessage(`§7[§rConfig§r§7]§8:§r §bReloaded§7.§r`)
      loadPlugins(false)
    }
  })
})