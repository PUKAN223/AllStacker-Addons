import { Entity, ItemEnchantableComponent } from "@minecraft/server";
import { itemStackData, UnStackItem } from "../Configs/Database";

export default function getItemNearBy(en: Entity, raduis: number = 7) {
  const itemNearBy = en.dimension.getEntities({ "maxDistance": raduis, "location": en.location, "type": "minecraft:item" }).filter((x) => {
    const item = en.getComponent("item").itemStack;
    const target = x.getComponent("item").itemStack;
    if ([...UnStackItem.keys()].some(x => x == target.typeId)) return false;
    if (target.nameTag) return false
    if (!itemStackData.has(x.id)) return false;
    if (en.id == x.id) return false;
    if (item.getLore().join(",") !== target.getLore().join(",")) return false;
    if (item.typeId !== target.typeId) return false;
    if (item.hasComponent(ItemEnchantableComponent.componentId) && target.hasComponent(ItemEnchantableComponent.componentId)) {
      const itemEn = item.getComponent(ItemEnchantableComponent.componentId);
      const targetEn = target.getComponent(ItemEnchantableComponent.componentId);
      if ((itemEn.getEnchantments().map(x => x.type.id).join(",") == targetEn.getEnchantments().map(x => x.type.id).join(","))) {
        let isSame = true;
        for (const ench of itemEn.getEnchantments()) {
          if (ench.level !== targetEn.getEnchantment(ench.type).level) {
            isSame = false;
            break;
          }
        }
        if (!isSame) return false;
      } else return false;
    }
    return true;
  })

  return itemNearBy
}