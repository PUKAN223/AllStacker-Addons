import { EntitySpawnAfterEvent, EntitySpawnAfterEventSignal, ItemUseAfterEvent, PlayerInteractWithEntityBeforeEvent, world } from "@minecraft/server";
import allPlugins from "../../Configs/PluginConfigs";

export default class CustomItemUse {
  constructor(enabled: string, callback: (ev: ItemUseAfterEvent) => void) {
    world.afterEvents.itemUse.subscribe((ev) => {
      if (!allPlugins().find(x => x.name == enabled).setting.enabled) return
      callback(ev) 
    })
  }
}