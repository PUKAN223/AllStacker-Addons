import { world } from "@minecraft/server"
import Plugins from "../Interfaces/Plugin"
import ItemStacker from "../Plugins/ItemStacker"
import PluginManagers from "../Plugins/PluginManagers"
import MobStacker from "../Plugins/MobStacker"
import CommandBuilder from "../Plugins/CommandBuilders/index"

const data = JSON.parse(world.getDynamicProperty("pl-config") as string ?? "{}") as Plugins[]
const config = [
  {
    name: "Plugin Managers",
    main: PluginManagers,
    setting: {
      enabled: true,
      isLoader: true
    }
  },
  {
    name: "Item Stackers",
    main: ItemStacker,
    setting: {
      enabled: true,
      isLoader: false
    }
  },
  {
    name: "Mob Stackers",
    main: MobStacker,
    setting: {
      enabled: true,
      isLoader: false
    }
  },
  {
    name: "Command Builders",
    main: CommandBuilder,
    setting: {
      enabled: true,
      isLoader: true
    }
  }
]

function allPlugins(reset: boolean = false): Plugins[] {
  if ((JSON.parse(world.getDynamicProperty("pl-config") as string ?? "[]") as Plugins[]).length !== config.length) {
    world.sendMessage("§7[§r§5Detected§r§7]§8:§r §7Configs §6Changed§7.§r")
    world.setDynamicProperty("pl-config", JSON.stringify(config));
  }
  const configR: Plugins[] = []
  config.forEach((pl, i) => {
    configR.push({
      name: reset ? pl.name : (world.getDynamicProperty("pl-config") !== undefined ? (JSON.parse(world.getDynamicProperty("pl-config") as string) as Plugins[])[i].name : pl.name),
      main: pl.main,
      setting: reset ? pl.setting : (world.getDynamicProperty("pl-config") !== undefined ? (JSON.parse(world.getDynamicProperty("pl-config") as string) as Plugins[])[i].setting : pl.setting),
    })
  })

  return configR
}

export default allPlugins
