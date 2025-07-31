import { Entity, ItemStack } from "@minecraft/server";
import PluginSetting from "../../core/types/PluginSetting";
import ItemStacker from "../plugins/ItemStacker";
import ConfigMenu from "../plugins/ConfigMenu";
import { JsonDatabase } from "../../core";
import MobStacker from "../plugins/MobStacker";

export let PluginLoader: PluginSetting[] = [
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
                ItemListStack: new Set<Entity>(),
                SeeingItemStack: new Set<Entity>(),
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
                ResetEntities: new Set<Entity>(),
                MobStackConfig: null,
                PluginIcon: "textures/items/spawn_eggs/spawn_egg_cow",
                isLoaded: false,
                Xp_Queue: new Map<string, number>()
            }
        }
    }
]

export function getPluginSettings(pluginName: string): PluginSetting | undefined {
    return PluginLoader.find(plugin => plugin.name === pluginName);
}