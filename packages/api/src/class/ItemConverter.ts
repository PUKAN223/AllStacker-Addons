import { Enchantment, ItemLockMode, ItemStack } from "@minecraft/server";
import { ItemJson } from  "@packages/api/src/types/ItemJson.ts";

class ItemConverter {
  private static instance: ItemConverter;
  private static isLoaded: boolean = false;
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

  public ItemToJson(item: ItemStack): ItemJson {
    const itemDynamic: { id: string; data: unknown }[] = [];
    let itemDurability: number = 0;
    let itemEnchantment: Enchantment[] = [];
    if (item.getDynamicPropertyIds().length !== 0) {
      item.getDynamicPropertyIds().forEach((ids) => {
        itemDynamic.push({ id: ids, data: item.getDynamicProperty(ids) });
      });
    }
    if (
      item.getComponent("durability") &&
      item.getComponent("durability")!.damage !== 0
    ) {
      itemDurability = item.getComponent("durability")!.damage;
    }
    if (
      item.getComponent("enchantable") &&
      item.getComponent("enchantable")!.getEnchantments().length !== 0
    ) {
      itemEnchantment = item.getComponent("enchantable")!.getEnchantments();
    }
    const data = {
      typeId: item.typeId,
      amount: item.amount,
      keepOnDeath: item.keepOnDeath,
      lockMode: item.lockMode,
      maxAmount: item.maxAmount,
      nameTag: item.nameTag,
      dynamicProperty: itemDynamic ?? undefined,
      lores: item.getLore(),
      can_destroy: item.getCanDestroy(),
      can_placeon: item.getCanPlaceOn(),
      durability: itemDurability,
      enchants: itemEnchantment ?? [],
    };
    return data;
  }

  public JsonToItem(itemJson: ItemJson): ItemStack {
    const items = new ItemStack(itemJson.typeId, itemJson.amount);
    try {
      items.setCanDestroy(itemJson.can_destroy);
      items.setCanPlaceOn(itemJson.can_placeon);
      if (itemJson.durability) {
        const durability = items.getComponent("durability");
        if (durability) {
          durability.damage = itemJson.durability;
        }
      }
      if (itemJson.dynamicProperty?.length) {
        itemJson.dynamicProperty.forEach(({ id, data }) => {
          items.setDynamicProperty(id, data as number | string | boolean);
        });
      }
      if (itemJson.enchants?.length) {
        const enchantable = items.getComponent("enchantable");
        if (enchantable) {
          itemJson.enchants.forEach((enc) => {
            enchantable.addEnchantment({
              type: enc.type,
              level: enc.level,
            });
          });
        }
      }
      items.keepOnDeath = itemJson.keepOnDeath ?? false;
      if (
        itemJson.lockMode &&
        ItemLockMode[itemJson.lockMode as keyof typeof ItemLockMode]
      ) {
        items.lockMode =
          ItemLockMode[itemJson.lockMode as keyof typeof ItemLockMode];
      }
      items.setLore(itemJson.lores);
      items.nameTag = itemJson.nameTag;
      return items;
    } catch (_error) {
      return items;
    }
  }
}

export const ItemConvert = ItemConverter.getInstance();
