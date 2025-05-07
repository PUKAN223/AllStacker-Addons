import { EntityDieAfterEvent, EntitySpawnAfterEvent, EntitySpawnAfterEventSignal, world } from "@minecraft/server";
import allPlugins from "../../Configs/PluginConfigs";

export default class CustomEntityDie {
  constructor(enabled: string, callback: (ev: EntityDieAfterEvent) => void) {
    world.afterEvents.entityDie.subscribe((ev) => {
      if (!allPlugins().find(x => x.name == enabled).setting.enabled) return
      callback(ev) 
    })
  }
}