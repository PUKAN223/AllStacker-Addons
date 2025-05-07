import { system } from "@minecraft/server";
import allPlugins from "../../Configs/PluginConfigs";
export default class CustomTick {
    constructor(enabled, delay, callback) {
        system.runInterval(() => {
            if (!allPlugins().find(x => x.name == enabled).setting.enabled)
                return;
            callback();
        }, delay);
    }
}
//# sourceMappingURL=index.js.map