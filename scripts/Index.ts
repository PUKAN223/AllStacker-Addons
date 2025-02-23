import { MinecraftDimensionTypes, system, world } from "@minecraft/server";
import allPlugins from "./Configs/PluginConfigs";
import Plugins from "./Class/Plugins";

function main() {
  const loaderPlugins = allPlugins().find(x => x.setting.isLoader == true)
  console.warn(loaderPlugins)
  const loaderClass = new loaderPlugins.main(loaderPlugins.name) as Plugins
  loaderClass.setup()
  loaderClass.init()
}

system.run(main)