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
      world.sendMessage(`§7[§rConfig§r§7]§8:§r §bLoaded.§7.§r`)
    })
  }

  public init(): void {
    world.afterEvents.worldInitialize.subscribe((ev) => {
      system.run(loadPlugins);
    })
  }
}
