import { world } from "@minecraft/server";
import allPlugins from "../../../Configs/PluginConfigs";
export default function setConfig(name, bool) {
    let config = [];
    allPlugins().forEach((pl) => {
        if (pl.name == name) {
            config.push(Object.assign(Object.assign({}, pl), { setting: Object.assign(Object.assign({}, pl.setting), { enabled: bool }) }));
        }
        else {
            config.push(pl);
        }
    });
    world.setDynamicProperty("pl-config", JSON.stringify(config));
}
//# sourceMappingURL=SetConfig.js.map