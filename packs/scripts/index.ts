import { PluginLoader } from "./kisux3/configs/PluginLoader.ts";
import { KXEvents, PluginManager } from "./core/index.ts";
import "./kisux3/configs/Lang.ts";

//PluginManager instance
const pluginManager = PluginManager.getInstance();

//Register loader plugins
pluginManager.registerPlugins(PluginLoader);

(() => {
  KXEvents.on(null, "before:startup", (ev) => {
    pluginManager.startupPlugins(pluginManager.getPlugins(), ev);
  });

  KXEvents.on(null, "after:worldLoad", (ev) => {
    const loader = PluginLoader.find((x) => x.setting.config?.Loadder);
    if (loader) {
      loader.main.onLoad(ev);
      loader.setting.config!.LoadedConfig = true;
    }

    PluginLoader.filter((plugin) =>
      plugin.name !== loader?.name && plugin.setting.enabled
    ).forEach((plugin) => {
      if (plugin.main.onLoad) {
        plugin.main.onLoad(ev);
      }
    });
  });

  KXEvents.on(null, "before:shutdown", (ev) => {
    pluginManager.shutdownPlugins(pluginManager.getPlugins(), ev);
  });
})();

//reset
// KXEvents.on(null, "after:worldLoad", (ev) => {
//     world.clearDynamicProperties();
// });
