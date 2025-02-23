import { system, world } from "@minecraft/server";
import allPlugins from "../../Configs/PluginConfigs";
import Plugins from "../../Class/Plugins";
import loadPlugins from "./Functions/LoadConfig";
import showForm from "./Functions/SettingForms";
export default class PluginManagers extends Plugins {
    constructor(name) {
        super(name);
    }
    setup() {
        system.run(() => {
            world.sendMessage(`§7[§rConfig§r§7]§8:§r §bLoaded.§7.§r`);
            loadPlugins();
        });
    }
    init() {
        world.beforeEvents.chatSend.subscribe((ev) => {
            if (ev.message == "!plm-reset") {
                system.run(() => {
                    world.setDynamicProperty("pl-config", JSON.stringify(allPlugins(true)));
                    world.getAllPlayers().forEach(pl => {
                        if (pl.isOp()) {
                            world.sendMessage(`§7[§rConfig§r§7]§8:§r §bReloaded§7.§r`);
                            loadPlugins(false);
                        }
                    });
                });
                ev.cancel = true;
            }
            else if (ev.message == "!plm-config") {
                system.run(() => {
                    showForm(ev.sender);
                });
                ev.cancel = true;
            }
        });
    }
}
//# sourceMappingURL=index.js.map