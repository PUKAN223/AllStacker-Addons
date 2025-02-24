import { world } from "@minecraft/server"
import allPlugins from "../../../Configs/PluginConfigs"
import Plugins from "../../../Class/Plugins"

export default function loadPlugins(init: boolean = true) {
  for (let x of allPlugins().filter(x => x.setting.isLoader !== true)) {
    world.getAllPlayers().forEach(pl => {
      if (pl.isOp()) {
        if (x.setting.enabled) {
          if (init) {
            const pluginMain = new x.main(x.name) as Plugins
            pluginMain.setup()
            pluginMain.init()
          }
          pl.sendMessage(`§7[§r${x.name}§r§7]§8:§r §aEnabled§7.§r`)
        } else {
          pl.sendMessage(`§7[§r${x.name}§r§7]§8:§r §cDisabled§7.§r`)
        }
      }
    })
  }
}