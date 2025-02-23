import { system } from "@minecraft/server";
import allPlugins from "./Configs/PluginConfigs";
function main() {
    const loaderPlugins = allPlugins().find(x => x.setting.isLoader == true);
    console.warn(loaderPlugins);
    const loaderClass = new loaderPlugins.main(loaderPlugins.name);
    loaderClass.setup();
    loaderClass.init();
}
system.run(main);
//# sourceMappingURL=Index.js.map