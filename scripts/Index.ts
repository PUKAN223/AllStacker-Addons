import { MinecraftDimensionTypes, system, world } from "@minecraft/server";
import allPlugins from "./Configs/PluginConfigs";
import Plugins from "./Class/Plugins";
import { itemCode, itemStackMap } from "./Plugins/ItemStacker/Configs/Databases";

function main() {
  allPlugins().filter(x => x.setting.isLoader == true).forEach((x, i) => {
    const main = new x.main(x.name) as Plugins;
    main.setup()
    main.init()
  })
}

system.run(main)