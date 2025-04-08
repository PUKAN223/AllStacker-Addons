import { EntityRemoveBeforeEvent, EntitySpawnAfterEvent, EntitySpawnAfterEventSignal, world } from "@minecraft/server";
import allPlugins from "../../Configs/PluginConfigs";

export default class CustomEntityRemoved {
  constructor(enabled: string, callback: (ev: EntityRemoveBeforeEvent) => void) {
    world.beforeEvents.entityRemove.subscribe((ev) => {
      if (!allPlugins().find(x => x.name == enabled).setting.enabled) return
      callback(ev) 
    })
  }
}