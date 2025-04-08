import { system, world } from "@minecraft/server";
import allPlugins from "../../Configs/PluginConfigs";
import Plugins from "../../Class/Plugins";
import loadPlugins from "./Functions/LoadConfig";
import showForm from "./Functions/SettingForms";
import "./Commands/PluginConfig"
import "./Commands/PluginReset"

export default class PluginManagers extends Plugins {
  constructor(name: string) {
    super(name)
  }

  public setup(): void {
    system.run(() => {
      world.sendMessage(`§7[§rConfig§r§7]§8:§r §bโหลดสำเร็จ.§7.§r`)
    })
  }

  public init(): void {
    function* run() {
      if (world.getAllPlayers().length > 0) {
        loadPlugins(true)
      } else {
        system.runJob(run())
      }
    }
    system.runJob(run())
  }
}
