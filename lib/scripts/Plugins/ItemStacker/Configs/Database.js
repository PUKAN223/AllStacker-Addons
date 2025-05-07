import { system, world } from "@minecraft/server";
import { JsonDatabase } from "./con-database";
export let itemStackData;
export let UnStackItem;
export let DisplayText;
export let UnStackMob;
export let isLoaded = false;
system.run(() => {
    itemStackData = new JsonDatabase("ItemStacker", world);
    UnStackItem = new JsonDatabase("UnStackItem", world);
    DisplayText = new JsonDatabase("DisplayText", world);
    if (!DisplayText.has("itemStack")) {
        DisplayText.set("itemStack", "§7x§c%a §e%n§r\n§7Respawn in %m§am §7%s§as§r");
    }
    UnStackMob = new JsonDatabase("UnStackMob", world);
    if (UnStackMob.size == 0) {
        UnStackMob.set("minecraft:pig", true);
        UnStackMob.set("minecraft:cow", true);
        UnStackMob.set("minecraft:chicken", true);
        UnStackMob.set("minecraft:sheep", true);
    }
    isLoaded = true;
});
export const ItemListStack = new Set();
export const SeeingItem = new Set();
//# sourceMappingURL=Database.js.map