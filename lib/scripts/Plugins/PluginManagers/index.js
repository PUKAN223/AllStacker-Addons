import { system, world } from "@minecraft/server";
import Plugins from "../../Class/Plugins";
import loadPlugins from "./Functions/LoadConfig";
export default class PluginManagers extends Plugins {
    constructor(name) {
        super(name);
    }
    setup() {
        system.run(() => {
            world.sendMessage(`§7[§rConfig§r§7]§8:§r §bโหลดสำเร็จ.§7.§r`);
        });
    }
    init() {
        function* run() {
            if (world.getAllPlayers().length > 0) {
                loadPlugins(true);
            }
            else {
                system.runJob(run());
            }
        }
        system.runJob(run());
    }
}
//# sourceMappingURL=index.js.map