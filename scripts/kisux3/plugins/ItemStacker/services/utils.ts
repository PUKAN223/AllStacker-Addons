import { Entity, ItemEnchantableComponent, ItemStack, system, Vector3, world } from "@minecraft/server";
import { IConfigItemStacker } from "..";
import { getAllEntities } from "../../../../core/utils/EntityManagers";
import { Vector3Utils } from "@minecraft/math";
import { ItemConvert, ItemJson } from "../../../../core";
import { getAllPlayers } from "../../../../core/utils/PlayerManagers";

const ItemDimensionSave = new Map<string,  { amount: number, item: ItemJson, life: number, currAmount: number, nowAmount: number }>();

export function* StackingItem(config: IConfigItemStacker): Generator<void, void, void> {
  try {
    const UnStackItem: string[] = config.ItemStackConfig.has("UnStackItem") ? config.ItemStackConfig.get("UnStackItem") : [];

    const CombineItemStack = (en: Entity) => {
      if (!en.isValid) return;

      const item = en.getComponent("item").itemStack;
      let totalAmount = 0;

      if (!(item.nameTag || item.typeId.includes("potion") || ([...UnStackItem].some(x => x == item.typeId)))) {
        const itemNearBy = getItemNearBy(en, config);
        for (const target of itemNearBy) {
          totalAmount += config.ItemStackData.get(target.id).amount;
          if (config.ItemStackData.has(target.id)) config.ItemStackData.delete(target.id)
          if (config.ItemListStack.has(target)) config.ItemListStack.delete(target);
          target.addTag("fakeItem")
          target.remove();
        }
      }
      config.ItemStackData.set(en.id, { amount: totalAmount + item.amount, item: ItemConvert.ItemToJson(item), life: system.currentTick, currAmount: totalAmount, nowAmount: en.getComponent("item").itemStack.amount });
      config.ItemListStack.delete(en)
    }

    const UpdateItemStack = (enData: any) => {
      const en = world.getDimension("overworld").getEntities().filter(x => x.id == enData[0])[0]
      if (en && en.isValid) {
        const data = config.ItemStackData.get(en.id)
        const item = en.getComponent("item").itemStack;
        config.ItemStackData.set(en.id, { amount: data.currAmount + item.amount, item: data.item, life: data.life, currAmount: data.currAmount, nowAmount: en.getComponent("item").itemStack.amount });
      }
    }

    if (system.currentTick % 2 === 0) {
      for (const en of config.ItemListStack) {
        CombineItemStack(en);
        yield;
      }
    } else {
      for (const enData of config.ItemStackData) {
        UpdateItemStack(enData)
        yield;
      }
    }
    system.run(() => system.runJob(StackingItem(config)));
  } catch (e) {
    system.run(() => {
      StackingItem(config);
    })
  }
}

export function* SeeingItem(config: IConfigItemStacker): Generator<void, void, void> {
  try {
    const ListStack: string[] = [...config.ItemStackData.keys()]
    const radiusSeeing = config.ItemStackConfig.get("RadiusSeeing") || 7;
    for (const pl of world.getAllPlayers()) {
      const allEnititys = pl.dimension.getEntities({ type: "minecraft:item" }).filter(x => ListStack.some(d => d == x.id))
      const filterEntitys = pl.dimension.getEntities({ maxDistance: radiusSeeing, location: pl.location, type: "minecraft:item" }).filter(x => ListStack.some(d => d == x.id))

      const updateItemName = (en: Entity) => {
        const itemData = config.ItemStackData.get(en.id) as { amount: number, item: ItemStack, life: number };
        const displayText = config.ItemStackConfig.get("DisplayText") as string || "";

        if (itemData && en.isValid) {
          const timeData = getTimeRemaining(5, 30, itemData.life)
          let text = displayText;
          text = `§e ` + text
          text = text.replace(/%a/g, `${getItemColorCode(itemData.amount)}x${itemData.amount}§r`)
          text = text.replace(/%n/g, ItemsToName(en))
          text = text.replace(/%m/g, `${Math.max(timeData.m, 0)}`)
          text = text.replace(/%s/g, `${timeData.s}`)
          text = text.replace(/%l/g, "\n")
          en.nameTag = text;
        }
      }

      const updateTime = (en: Entity, itemData: { amount: number, item: ItemStack, life: number }) => {
        const timeData = getTimeRemaining(5, 30, itemData.life)
        if (timeData.m < 0) {
          config.ItemStackData.delete(en.id);
          en.addTag("fakeItem")
          en.remove();
        } else if (system.currentTick % 20 == 0) {
          const playerNears = getAllPlayers((pl) => {
            return Vector3Utils.distance(pl.location, en.location) <= radiusSeeing && pl.dimension === en.dimension;
          })

          if (playerNears.length == 0) en.nameTag = "";
        };
      }

      for (const en of filterEntitys) {
        updateItemName(en);
        yield;
      }

      for (const en of allEnititys) {
        const itemData = config.ItemStackData.get(en.id) as { amount: number, item: ItemStack, life: number };
        if (itemData && en.isValid) {
          updateTime(en, itemData);
          yield;
        }
      }
      yield;
    }
    system.runJob(SeeingItem(config));
  } catch (e) {
    system.run(() => {
      SeeingItem(config);
    })
  }
}

export default function getItemNearBy(en: Entity, config: IConfigItemStacker): Entity[] {
  const radius = config.ItemStackConfig.get("RadiusCombine") || 15;
  const UnStackItem = config.ItemStackConfig.get("UnStackItem") || [];
  const itemStack = en.getComponent("item").itemStack;

  const allEntities = getAllEntities((x) => {
    if (x.dimension !== en.dimension) return false;
    if (x.typeId !== "minecraft:item") return false;
    if (Vector3Utils.distance(en.location, x.location) > radius) return false;
    return true;
  });

  return allEntities.filter((target) => {
    if (!en.isValid || !target.isValid) return false;
    if (target.id === en.id) return false;

    const targetItemStack = target.getComponent("item").itemStack;

    if ([...UnStackItem].some(x => x == targetItemStack.typeId)) return false;
    if (targetItemStack.nameTag) return false;
    if (!config.ItemStackData.has(target.id)) return false;
    if (itemStack.getLore().join(",") !== targetItemStack.getLore().join(",")) return false;
    if (itemStack.typeId !== targetItemStack.typeId) return false;

    if (itemStack.hasComponent(ItemEnchantableComponent.componentId) && targetItemStack.hasComponent(ItemEnchantableComponent.componentId)) {
      const itemEn = itemStack.getComponent(ItemEnchantableComponent.componentId);
      const targetEn = targetItemStack.getComponent(ItemEnchantableComponent.componentId);
      const itemEnchants = itemEn.getEnchantments();
      const targetEnchants = targetEn.getEnchantments();

      if (itemEnchants.length !== targetEnchants.length) return false;
      for (let i = 0; i < itemEnchants.length; i++) {
        if (
          itemEnchants[i].type.id !== targetEnchants[i].type.id ||
          itemEnchants[i].level !== targetEnchants[i].level
        ) {
          return false;
        }
      }
    }

    return true;
  });
}

export function getTimeRemaining(minutes: number, seconds: number, referenceTick: number): { m: number, s: number } {
  const now = system.currentTick;
  const specifiedTimeTicks = (minutes * 60 + seconds) * 20;

  const targetTick = referenceTick + specifiedTimeTicks;
  let diffTicks = targetTick - now;

  const diffMinutes = Math.floor(diffTicks / (20 * 60));
  diffTicks -= diffMinutes * (20 * 60);
  const diffSeconds = Math.floor(diffTicks / 20);

  return { m: diffMinutes, s: diffSeconds };
}

export function ItemsToName(entity: Entity) {
  return entity.getComponent("item").itemStack.nameTag ? entity.getComponent("item").itemStack.nameTag : entity.getComponent("item").itemStack.typeId
    .split(":")[1]
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getItemColorCode(amount: number) {
  if (amount >= 1290) return "§9";
  if (amount >= 960) return "§b";
  if (amount >= 390) return "§a";
  if (amount >= 108) return "§e";
  if (amount >= 88) return "§g";
  if (amount >= 68) return "§p";
  if (amount >= 48) return "§6";
  if (amount >= 18) return "§v";
  return "§c";
}

export function deStackItemStack(config: IConfigItemStacker, itemRemovedData: { location: Vector3, id: string, dim: string }) {
  try {
    const itemData = ItemDimensionSave.has(itemRemovedData.id) ? ItemDimensionSave.get(itemRemovedData.id) : config.ItemStackData.get(itemRemovedData.id) as { amount: number, item: ItemJson, life: number, currAmount: number, nowAmount: number };
    if (!itemData) return;
    const itemToSpawn = itemData.amount - itemData.nowAmount;
    if (itemToSpawn > 0) {
      const itemStackSpawn = ItemConvert.JsonToItem(itemData.item).clone ? ItemConvert.JsonToItem(itemData.item).clone() : new ItemStack(itemData.item.typeId, itemData.item.amount);
      itemStackSpawn.amount = itemToSpawn <= itemStackSpawn.maxAmount ? itemToSpawn : itemStackSpawn.maxAmount;
      const itemSetData = { ...itemData };
      itemSetData.currAmount -= itemStackSpawn.amount;
      itemSetData.amount -= itemStackSpawn.amount;
      const enBase = world.getDimension(itemRemovedData.dim).spawnItem(itemStackSpawn, { ...itemRemovedData.location, y: world.getDimension(itemRemovedData.dim).heightRange.max });
      const itemStackData = config.ItemStackData;
      itemStackData.set(enBase.id, itemSetData);
      system.run(() => {
        if (!enBase.isValid) return;
        enBase.teleport({ x: itemRemovedData.location.x, y: itemRemovedData.location.y, z: itemRemovedData.location.z });
      })
    }
    config.ItemStackData.delete(itemRemovedData.id);
    if (ItemDimensionSave.has(itemRemovedData.id)) {
      ItemDimensionSave.delete(itemRemovedData.id);
    }
  } catch (e) {
    //Why. but is can detect hopper.
    const itemData = config.ItemStackData.get(itemRemovedData.id) as { amount: number, item: ItemJson, life: number, currAmount: number, nowAmount: number };
    console.warn((e as Error).message)
    if ((e as Error).message.includes("Trying to")) {
      ItemDimensionSave.set(itemRemovedData.id, itemData);
      console.info(`ItemStacker: Item ${itemRemovedData.id} is in a different dimension, saving data for later.`);
      return;
    };
    system.run(() => {
      const itemStack = ItemConvert.JsonToItem(itemData.item);
      const sizeStack = getSizeStack(itemData.amount - itemData.currAmount, itemData.amount, itemStack.maxAmount)
      const itemStackSpawn = ItemConvert.JsonToItem(itemData.item).clone ? ItemConvert.JsonToItem(itemData.item).clone() : new ItemStack(itemData.item.typeId, itemData.item.amount);
      sizeStack.forEach((item) => {
        itemStackSpawn.amount = item;
        const enBase = world.getDimension(itemRemovedData.dim).spawnItem(ItemConvert.JsonToItem(itemStackSpawn), { ...itemRemovedData.location, y: itemRemovedData.location.y + 100 });
        enBase.addTag("fakeItem");
        system.runTimeout(() => {
          if (enBase.isValid) {
            config.ItemListStack.add(enBase);
          }
        }, 40)
      });
    })
    config.ItemStackData.delete(itemRemovedData.id);
  }
}


export function getSizeStack(current: number, amount: number, maxStack: number) {
  const remaining = amount - current;
  return [...Array(Math.floor(remaining / maxStack)).fill(maxStack), remaining % maxStack].filter(Boolean);
}