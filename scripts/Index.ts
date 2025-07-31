import { PluginLoader } from "./kisux3/configs/PluginLoader";
import { KXEvents, PluginManager } from "./core";
import { system, world } from "@minecraft/server";
import "./kisux3/configs/Lang"

const pluginManager = PluginManager.getInstance();
pluginManager.registerPlugins(PluginLoader);

KXEvents.on(null, "before:startup", (ev) => {
    pluginManager.startupPlugins(pluginManager.getPlugins(), ev);
})

KXEvents.on(null, "after:worldLoad", (ev) => {
    const loadder = PluginLoader.find((x) => x.setting.config?.Loadder);
    if (loadder) {
        loadder.main.onLoad(ev);
    }

    const i = system.runInterval(() => {
        if (loadder.setting.config.LoadedConfig) {
            system.clearRun(i);
            pluginManager.getPlugins().filter(plugin => plugin.name !== loadder.name).forEach(plugin => {
                if (plugin.main.onLoad) {
                    plugin.main.onLoad(ev);
                }
            });
        }
    }, 1)
})

KXEvents.on(null, "before:shutdown", (ev) => {
    pluginManager.shutdownPlugins(pluginManager.getPlugins(), ev);
})

//reset
// KXEvents.on(null, "after:worldLoad", (ev) => {
//     world.clearDynamicProperties();
// });