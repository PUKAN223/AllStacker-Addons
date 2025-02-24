var _a;
import { world } from "@minecraft/server";
import ItemStacker from "../Plugins/ItemStacker";
import PluginManagers from "../Plugins/PluginManagers";
import MobStacker from "../Plugins/MobStacker";
const data = JSON.parse((_a = world.getDynamicProperty("pl-config")) !== null && _a !== void 0 ? _a : "{}");
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
    }
];
function allPlugins(reset = false) {
    var _a;
    if (JSON.parse((_a = world.getDynamicProperty("pl-config")) !== null && _a !== void 0 ? _a : "[]").length !== config.length) {
        world.sendMessage("§7[§r§5Detected§r§7]§8:§r §7Configs §6Changed§7.§r");
        world.setDynamicProperty("pl-config", JSON.stringify(config));
    }
    const configR = [];
    config.forEach((pl, i) => {
        configR.push({
            name: reset ? pl.name : (world.getDynamicProperty("pl-config") !== undefined ? JSON.parse(world.getDynamicProperty("pl-config"))[i].name : pl.name),
            main: pl.main,
            setting: reset ? pl.setting : (world.getDynamicProperty("pl-config") !== undefined ? JSON.parse(world.getDynamicProperty("pl-config"))[i].setting : pl.setting),
        });
    });
    return configR;
}
export default allPlugins;
//# sourceMappingURL=PluginConfigs.js.map