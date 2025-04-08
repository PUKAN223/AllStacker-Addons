import { system, world } from "@minecraft/server";
import allPlugins from "./Configs/PluginConfigs";
function main() {
    allPlugins().filter(x => x.setting.isLoader == true).forEach((x, i) => {
        const main = new x.main(x.name);
        main.setup();
        main.init();
    });
}
world.afterEvents.worldLoad.subscribe((ev) => {
    system.run(main);
});
//# sourceMappingURL=Index.js.map