import { EntitySpawnAfterEvent, EntitySpawnAfterEventSignal, system, world } from "@minecraft/server";
import allPlugins from "../../Configs/PluginConfigs";

export default class CustomTick {
  constructor(enabled: string, delay: number, callback: () => void) {
    system.runInterval(() => {
      if (!allPlugins().find(x => x.name == enabled).setting.enabled) return
      callback() 
    }, delay)
  }
}