import { world } from "@minecraft/server"
import allPlugins from "../../../Configs/PluginConfigs"
import Plugins from "../../../Class/Plugins"

export default function loadPlugins(init: boolean = true, log: boolean = true) {
  for (let x of allPlugins().filter(x => x.setting.isLoader !== true)) {
    world.getAllPlayers().forEach(pl => {
      if (pl.isOp()) {
        if (x.setting.enabled) {
          if (init) {
            const pluginMain = new x.main(x.name) as Plugins
            pluginMain.setup()
            pluginMain.init()
          }
          if (log) pl.sendMessage(`§7[§r${x.name}§r§7]§8:§r §aเปิดใช้งานเเล้ว§7.§r`)
        } else {
          if (log) pl.sendMessage(`§7[§r${x.name}§r§7]§8:§r §cปิดใช้งาน§7.§r`)
        }
      }
    })
  }
}