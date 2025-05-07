import { EntitySpawnAfterEvent, EntitySpawnAfterEventSignal, PlayerInteractWithEntityBeforeEvent, world } from "@minecraft/server";
import allPlugins from "../../Configs/PluginConfigs";

export default class CustomEntityInteract {
  constructor(enabled: string, callback: (ev: PlayerInteractWithEntityBeforeEvent) => void) {
    world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
      if (!allPlugins().find(x => x.name == enabled).setting.enabled) return
      callback(ev) 
    })
  }
}