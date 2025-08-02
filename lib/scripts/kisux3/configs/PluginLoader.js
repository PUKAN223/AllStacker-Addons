import ItemStacker from "../plugins/ItemStacker";
import ConfigMenu from "../plugins/ConfigMenu";
import MobStacker from "../plugins/MobStacker";
export let PluginLoader = [
    {
        name: "ConfigMenu",
        description: "Provides a configuration menu for plugins.",
        version: "1.0.0",
        main: new ConfigMenu("ConfigMenu", "Provides a configuration menu for plugins.", "1.0.0"),
        setting: {
            enabled: true,
            config: {
                PluginEnabled: null,
                LoadedConfig: false,
                Loadder: true
            }
        }
    },
    {
        name: "Item Stackers",
        description: "Manage item stacking configurations.",
        version: "1.0.0",
        main: new ItemStacker("Item Stackers", "Manage item stacking configurations.", "1.0.0"),
        setting: {
            enabled: true,
            config: {
                RadiusSeeing: null,
                ItemStackData: null,
                ItemListStack: new Set(),
                SeeingItemStack: new Set(),
                DimensionDataBackUp: null,
                PluginIcon: "textures/items/arrow",
                isLoaded: false,
            }
        }
    },
    {
        name: "Mob Stacker",
        description: "Manage mob stacking configurations.",
        version: "1.0.0",
        main: new MobStacker("Mob Stacker", "Manage mob stacking configurations.", "1.0.0"),
        setting: {
            enabled: true,
            config: {
                ResetEntities: new Set(),
                MobStackConfig: null,
                PluginIcon: "textures/items/spawn_eggs/spawn_egg_cow",
                isLoaded: false,
                Xp_Queue: new Map()
            }
        }
    }
];
export function getPluginSettings(pluginName) {
    return PluginLoader.find(plugin => plugin.name === pluginName);
}
//# sourceMappingURL=PluginLoader.js.map