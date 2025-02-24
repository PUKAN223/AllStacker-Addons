import { system, world } from "@minecraft/server";
import Plugins from "../../Class/Plugins";
import loadPlugins from "./Functions/LoadConfig";
import "./Commands/PluginConfig";
import "./Commands/PluginReset";
export default class PluginManagers extends Plugins {
    constructor(name) {
        super(name);
    }
    setup() {
        system.run(() => {
            world.sendMessage(`§7[§rConfig§r§7]§8:§r §bLoaded.§7.§r`);
        });
    }
    init() {
        world.afterEvents.worldInitialize.subscribe((ev) => {
            system.run(loadPlugins);
        });
    }
}
//# sourceMappingURL=index.js.map