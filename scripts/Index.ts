import { system, world } from "@minecraft/server";
import allPlugins from "./Configs/PluginConfigs";
import Plugins from "./Class/Plugins";

function main() {
  allPlugins().filter(x => x.setting.isLoader == true).forEach((x, i) => {
    const main = new x.main(x.name) as Plugins;
    main.setup()
    main.init()
  })
}

world.afterEvents.worldLoad.subscribe((ev) => {
  system.run(main);
})