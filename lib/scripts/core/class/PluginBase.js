import { Logger } from "./Logger";
import { PluginLoader } from "../../kisux3/configs/PluginLoader";
class PluginBase {
    constructor(name, description, version) {
        this.name = name;
        this.description = description;
        this.version = version;
        this.logger = Logger.getInstance();
    }
    getConfig() {
        const plugin = PluginLoader.find(plugin => plugin.name === this.name);
        if (!plugin)
            return {};
        return plugin.setting.config;
    }
    getName() {
        return this.name;
    }
    onLoad(ev) { }
    onStartup(ev) { }
    onShutdown(ev) { }
    addConfig(pl, page, showUI = true) {
        return false;
    }
}
export { PluginBase };
//# sourceMappingURL=PluginBase.js.map