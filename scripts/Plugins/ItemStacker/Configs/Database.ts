import { Entity, system, world } from "@minecraft/server";
import { Database } from "../../../Utilities/Database";
import { QIDB } from "../../../Utilities/QIDB";
import { DynamicTable, JsonDatabase, registryAPISerializers } from "./con-database";

export let itemStackData: JsonDatabase;
export let UnStackItem: JsonDatabase;
export let DisplayText: JsonDatabase;
export let UnStackMob: JsonDatabase
export let isLoaded: boolean = false;
system.run(() => {
  itemStackData = new JsonDatabase("ItemStacker", world);
  UnStackItem = new JsonDatabase("UnStackItem", world);
  DisplayText = new JsonDatabase("DisplayText", world);
  if (!DisplayText.has("itemStack")) {
    DisplayText.set("itemStack", "§7x§c%a §e%n§r\n§7Respawn in %m§am §7%s§as§r")
  }
  UnStackMob = new JsonDatabase("UnStackMob", world);
  if (UnStackMob.size == 0) {
    UnStackMob.set("minecraft:pig", true);
    UnStackMob.set("minecraft:cow", true);
    UnStackMob.set("minecraft:chicken", true);
    UnStackMob.set("minecraft:sheep", true);
  }
  isLoaded = true;
})
export const ItemListStack = new Set<Entity>();
export const SeeingItem = new Set<Entity>();