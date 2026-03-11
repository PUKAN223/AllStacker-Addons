import type { Entity, ItemStack } from "@minecraft/server";
import type { Player } from "@minecraft/server";
import type { PluginBase } from "./PluginBase.ts";

const ItemActionRegistry = new Map<string, ItemActions>();

class ItemActionManager {
    private plugin: PluginBase;
    constructor(plugin: PluginBase) {
        this.plugin = plugin;
    }

    public registerItem(itemId: string): ItemActions {
        const itemActions = new ItemActions(itemId, this.plugin);
        ItemActionRegistry.set(itemId, itemActions);
        return itemActions;
    }

    public getItemActions(itemId: string): ItemActions | undefined {
        return ItemActionRegistry.get(itemId);
    }
}

class ItemActions {
    private itemId: string;
    private plugin: PluginBase;
    constructor(itemId: string, plugin: PluginBase) {
        this.itemId = itemId;
        this.plugin = plugin;
    }

    public onUse(callback: (player: Player, item: ItemStack) => void) {
        this.plugin.events.on("AfterItemUse", (ev) => {
            if (ev.itemStack.typeId !== this.itemId) return;
            callback(ev.source, ev.itemStack);
        });
    }

    //WIP
    public onHitEntity(callback: (player: Player, item: ItemStack, entity: Entity) => void) {
        this.plugin.events.on("AfterEntityHurt", (ev) => {
            const player = ev.damageSource.damagingEntity as Player;
            const items = player?.getComponent("inventory")?.container.getItem(player.selectedSlotIndex);
            if (!items) return;
            callback(player, items, ev.hurtEntity);
        });
    }
}

export { ItemActions, ItemActionManager };