import { PlayerSpawnAfterEvent, ItemStack } from "@minecraft/server";
import type { ConfigMenuPlugin } from "../index.ts";

export function onPlayerJoin(ev: PlayerSpawnAfterEvent, _plugin: ConfigMenuPlugin): void {
  if (!ev.initialSpawn) return;
  const pl = ev.player;
  const isFirstJoin = !pl.getTags().includes("kisu:joined_before");
  
  if (isFirstJoin) {
    pl.addTag("kisu:joined_before");
    
    const inventory = pl.getComponent("inventory");
    if (!inventory || !inventory.container) return;
    
    const configMenuItem = new ItemStack("kisu:ac_setting", 1);
    
    if (inventory.container.emptySlotsCount > 0) {
      inventory.container.addItem(configMenuItem);
    } else {
      pl.dimension.spawnItem(configMenuItem, pl.location);
    }
  }
}
