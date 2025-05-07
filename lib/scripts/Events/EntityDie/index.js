import { world } from "@minecraft/server";
import allPlugins from "../../Configs/PluginConfigs";
export default class CustomEntityDie {
    constructor(enabled, callback) {
        world.afterEvents.entityDie.subscribe((ev) => {
            if (!allPlugins().find(x => x.name == enabled).setting.enabled)
                return;
            callback(ev);
        });
    }
}
//# sourceMappingURL=index.js.map