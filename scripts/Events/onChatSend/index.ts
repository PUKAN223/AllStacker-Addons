import { ChatSendBeforeEvent, ChatSendBeforeEventSignal, EntitySpawnAfterEvent, EntitySpawnAfterEventSignal, PlayerInteractWithEntityBeforeEvent, world } from "@minecraft/server";
import allPlugins from "../../Configs/PluginConfigs";

export default class CustomOnChatSend {
  constructor(enabled: string, callback: (ev: ChatSendBeforeEvent) => void) {
    world.beforeEvents.chatSend.subscribe((ev) => {
      if (!allPlugins().find(x => x.name == enabled).setting.enabled) return
      callback(ev) 
    })
  }
}