import { ItemLockMode, ItemStack } from "@minecraft/server";
class ItemConverter {
    constructor() {
        if (ItemConverter.instance) {
            return ItemConverter.instance;
        }
        ItemConverter.instance = this;
        ItemConverter.isLoaded = true;
    }
    static getInstance() {
        if (!ItemConverter.instance) {
            ItemConverter.instance = new ItemConverter();
        }
        return ItemConverter.instance;
    }
    ItemToJson(item) {
        let itemDynamic = [];
        let itemDurability = 0;
        let itemEnchantment = [];
        if (item.getDynamicPropertyIds().length !== 0) {
            item.getDynamicPropertyIds().forEach(ids => {
                itemDynamic.push({ id: ids, data: item.getDynamicProperty(ids) });
            });
        }
        if (item.getComponent("durability") && item.getComponent("durability").damage !== 0) {
            itemDurability = item.getComponent("durability").damage;
        }
        if (item.getComponent("enchantable") && item.getComponent("enchantable").getEnchantments().length !== 0) {
            itemEnchantment = item.getComponent("enchantable").getEnchantments();
        }
        const data = {
            typeId: item.typeId,
            amount: item.amount,
            keepOnDeath: item.keepOnDeath,
            lockMode: item.lockMode,
            maxAmount: item.maxAmount,
            nameTag: item.nameTag,
            dynamicProperty: itemDynamic !== null && itemDynamic !== void 0 ? itemDynamic : undefined,
            lores: item.getLore(),
            can_destroy: item.getCanDestroy(),
            can_placeon: item.getCanPlaceOn(),
            durability: itemDurability,
            enchants: itemEnchantment !== null && itemEnchantment !== void 0 ? itemEnchantment : []
        };
        return data;
    }
    JsonToItem(itemJson) {
        const items = new ItemStack(itemJson.typeId, itemJson.amount);
        items.setCanDestroy(itemJson.can_destroy);
        items.setCanPlaceOn(itemJson.can_placeon);
        if (itemJson.durability) {
            items.getComponent("durability").damage = itemJson.durability;
        }
        itemJson.dynamicProperty.forEach(({ id, data }) => {
            items.setDynamicProperty(id, data);
        });
        if (itemJson.enchants) {
            itemJson.enchants.forEach(enc => {
                items.getComponent("enchantable").addEnchantment({ type: enc.type, level: enc.level });
            });
        }
        items.keepOnDeath = itemJson.keepOnDeath;
        items.lockMode = ItemLockMode[itemJson.lockMode];
        items.setLore(itemJson.lores);
        items.nameTag = itemJson.nameTag;
        return items;
    }
}
ItemConverter.isLoaded = false;
export const ItemConvert = ItemConverter.getInstance();
//# sourceMappingURL=ItemConverter.js.map