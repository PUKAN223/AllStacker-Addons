import { world } from "@minecraft/server"
import allPlugins from "../../../Configs/PluginConfigs"
import Plugins from "../../../Interfaces/Plugin"

export default function setConfig(name: string, bool: boolean) {
  let config: Plugins[] = []
    allPlugins().forEach((pl) => {
      if (pl.name == name) {
        config.push({ ...pl, setting: { ...pl.setting, enabled: bool } })
      } else {
        config.push(pl)
      }
    })
    world.setDynamicProperty("pl-config", JSON.stringify(config))
}