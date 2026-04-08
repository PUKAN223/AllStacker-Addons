import {
  Entity,
  ItemEnchantableComponent,
  ItemStack,
  system,
  Vector3,
  world,
} from "@minecraft/server";
import { IConfigItemStacker } from "../index.ts";
import { getAllEntities } from "../../../../core/utils/EntityManagers.ts";
import { Vector3Utils } from "npm:@minecraft/math@2.2.11";
import { ItemConvert, ItemJson } from "../../../../core/index.ts";
import { getAllPlayers } from "../../../../core/utils/PlayerManagers.ts";

function combineItemStack(en: Entity, config: IConfigItemStacker): void {
  if (!en.isValid) return;

  const item = en.getComponent("item")!.itemStack;
  const UnStackList = config.ItemStackConfig!.get("UnStackItem") as string[] || [];

  if (
    item.nameTag ||
    item.typeId.includes("potion") ||
    item.typeId.includes("shulker_box") ||
    item.typeId.includes("bundle") ||
    item.typeId.includes("bed") ||
    item.typeId.includes("bottle") ||
    UnStackList.some((x) => item.typeId.includes(x))
  ) return;

  const itemNearBy = getItemNearBy(en, config);

  let totalAmount = 0;
  if (itemNearBy.length > 0) {
    for (const target of itemNearBy) {
      totalAmount += config.ItemStackData!.get(target.id).amount;
      if (config.ItemStackData!.has(target.id)) {
        config.ItemStackData!.delete(target.id);
      }
      if (config.ItemListStack.has(target)) config.ItemListStack.delete(target);
      target.addTag("fakeItem");
      target.remove();
    }
  }
  config.ItemStackData!.set(en.id, {
    amount: totalAmount + item.amount,
    item: ItemConvert.ItemToJson(item),
    life: system.currentTick,
    currAmount: totalAmount,
    nowAmount: en.getComponent("item")!.itemStack.amount,
  });
  config.ItemListStack.delete(en);
}

function updateItemStack(
  enData: [unknown, Entity],
  config: IConfigItemStacker,
): void {
  const en =
    world.getDimension("overworld").getEntities().filter((x) =>
      x.id == enData[0]
    )[0];
  if (en && en.isValid) {
    const data = config.ItemStackData!.get(en.id);
    const item = en.getComponent("item")!.itemStack;
    config.ItemStackData!.set(en.id, {
      amount: data.currAmount + item.amount,
      item: data.item,
      life: data.life,
      currAmount: data.currAmount,
      nowAmount: en.getComponent("item")!.itemStack.amount,
    });
  }
}

export function* StackingItem(
  config: IConfigItemStacker,
): Generator<void, void, void> {
  try {
    if (system.currentTick % 2 === 0) {
      for (const en of config.ItemListStack) {
        combineItemStack(en, config);
        yield;
      }
    } else {
      for (const enData of config.ItemStackData!) {
        updateItemStack(enData, config);
        yield;
      }
    }

    const fastModeStacking = config.ItemStackConfig!.get("FastModeStacking");
    if (fastModeStacking) {
      system.run(() => FastModeStacking(config));
    } else {
      system.runJob(StackingItem(config));
    }
  } catch (_e) {
    system.run(() => {
      StackingItem(config);
    });
  }
}

export function FastModeStacking(config: IConfigItemStacker): void {
  try {
    if (system.currentTick % 2 === 0) {
      for (const en of config.ItemListStack) {
        combineItemStack(en, config);
      }
    } else {
      for (const enData of config.ItemStackData!) {
        updateItemStack(enData, config);
      }
    }

    const fastModeStacking = config.ItemStackConfig!.get("FastModeStacking");
    if (fastModeStacking) {
      system.run(() => FastModeStacking(config));
    } else {
      system.runJob(StackingItem(config));
    }
  } catch (e) {
    console.warn(e);
    system.run(() => {
      FastModeStacking(config);
    });
  }
}

export function* SeeingItem(
  config: IConfigItemStacker,
): Generator<void, void, void> {
  try {
    const ListStack = new Set(config.ItemStackData!.keys());
    const radiusSeeing = config.ItemStackConfig!.get("RadiusSeeing") || 7;
    for (const pl of world.getAllPlayers()) {
      const allEnititys = pl.dimension.getEntities({ type: "minecraft:item" })
        .filter((x) => ListStack.has(x.id));
      const filterEntitys = pl.dimension.getEntities({
        maxDistance: radiusSeeing,
        location: pl.location,
        type: "minecraft:item",
      }).filter((x) => ListStack.has(x.id));

      const updateItemName = (en: Entity) => {
        const itemData = config.ItemStackData!.get(en.id) as {
          amount: number;
          item: ItemStack;
          life: number;
        };
        const displayText =
          config.ItemStackConfig!.get("DisplayText") as string || "";

        if (itemData && en.isValid) {
          const timeData = getTimeRemaining(5, 30, itemData.life);
          let text = displayText;
          text = `§e ` + text;
          text = text.replace(
            /%a/g,
            `${getItemColorCode(itemData.amount)}x${itemData.amount}§r`,
          );
          text = text.replace(/%n/g, ItemsToName(en) ?? "Unknown Item");
          text = text.replace(/%m/g, `${Math.max(timeData.m, 0)}`);
          text = text.replace(/%s/g, `${timeData.s}`);
          text = text.replace(/%l/g, "\n");
          en.nameTag = text;
        }
      };

      const updateTime = (
        en: Entity,
        itemData: { amount: number; item: ItemStack; life: number },
      ) => {
        const timeData = getTimeRemaining(5, 30, itemData.life);
        if (timeData.m < 0) {
          config.ItemStackData!.delete(en.id);
          en.addTag("fakeItem");
          en.remove();
        } else if (system.currentTick % 20 == 0) {
          const playerNears = getAllPlayers((pl) => {
            return Vector3Utils.distance(pl.location, en.location) <=
                radiusSeeing && pl.dimension === en.dimension;
          });

          if (playerNears.length == 0) en.nameTag = "";
        }
      };

      for (const en of filterEntitys) {
        updateItemName(en);
        yield;
      }

      for (const en of allEnititys) {
        const itemData = config.ItemStackData!.get(en.id) as {
          amount: number;
          item: ItemStack;
          life: number;
        };
        if (itemData && en.isValid) {
          updateTime(en, itemData);
          yield;
        }
      }
      yield;
    }
    system.runJob(SeeingItem(config));
  } catch (_e) {
    system.run(() => {
      SeeingItem(config);
    });
  }
}

function canStack(
  item: ItemStack,
  target: ItemStack,
): boolean {
  if (item.nameTag || target.nameTag) return false;
  if (item.typeId !== target.typeId) return false;
  if (item.getLore().join(",") !== target.getLore().join(",")) return false;
  if (
    [...item.getTags()].sort().join(",") !==
      [...target.getTags()].sort().join(",")
  ) return false;
  if (
    item.hasComponent("minecraft:potion") ||
    target.hasComponent("minecraft:potion")
  ) return false;
  if (
    item.hasComponent("minecraft:book") || target.hasComponent("minecraft:book")
  ) return false;
  if (
    item.hasComponent("minecraft:inventory") ||
    target.hasComponent("minecraft:inventory")
  ) return false;

  if (
    item.hasComponent("minecraft:dyeable") &&
    target.hasComponent("minecraft:dyeable")
  ) {
    const itemColor = item.getComponent("minecraft:dyeable")!.color;
    const targetColor = target.getComponent("minecraft:dyeable")!.color;
    if (itemColor && targetColor && itemColor !== targetColor) return false;
  }

  if (
    item.hasComponent(ItemEnchantableComponent.componentId) &&
    target.hasComponent(ItemEnchantableComponent.componentId)
  ) {
    const itemEn = item.getComponent(ItemEnchantableComponent.componentId)!;
    const targetEn = target.getComponent(ItemEnchantableComponent.componentId)!;
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
}

export default function getItemNearBy(
  en: Entity,
  config: IConfigItemStacker,
): Entity[] {
  const radius = config.ItemStackConfig!.get("RadiusCombine") || 15;
  const UnStackList = config.ItemStackConfig!.get("UnStackItem") as string[] || [];
  const itemStack = en.getComponent("item")!.itemStack;

  const allEntities = getAllEntities((x) => {
    if (x.dimension !== en.dimension) return false;
    if (x.typeId !== "minecraft:item") return false;
    if (Vector3Utils.distance(en.location, x.location) > radius) return false;
    return true;
  });

  return allEntities.filter((target) => {
    if (!en.isValid || !target.isValid) return false;
    if (target.id === en.id) return false;
    if (!config.ItemStackData!.has(target.id)) return false;

    const targetItemStack = target.getComponent("item")!.itemStack;
    if (UnStackList.some((x) => targetItemStack.typeId.includes(x))) return false;

    return canStack(itemStack, targetItemStack);
  });
}

export function getTimeRemaining(
  minutes: number,
  seconds: number,
  referenceTick: number,
): { m: number; s: number } {
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
  return entity.getComponent("item")!.itemStack.nameTag
    ? entity.getComponent("item")!.itemStack.nameTag
    : entity.getComponent("item")!.itemStack.typeId
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

export function deStackItemStack(
  config: IConfigItemStacker,
  itemRemovedData: { location: Vector3; id: string; dim: string },
) {
  try {
    const itemData = config.DimensionDataBackUp!.has(itemRemovedData.id)
      ? config.DimensionDataBackUp!.get(itemRemovedData.id)
      : config.ItemStackData!.get(itemRemovedData.id) as {
        amount: number;
        item: ItemJson;
        life: number;
        currAmount: number;
        nowAmount: number;
      };
    if (!itemData) return;
    const itemToSpawn = itemData.amount - itemData.nowAmount;
    if (itemToSpawn > 0) {
      const itemStackSpawn = ItemConvert.JsonToItem(itemData.item).clone
        ? ItemConvert.JsonToItem(itemData.item).clone()
        : new ItemStack(itemData.item.typeId, itemData.item.amount);
      itemStackSpawn.amount = itemToSpawn <= itemStackSpawn.maxAmount
        ? itemToSpawn
        : itemStackSpawn.maxAmount;
      const itemSetData = { ...itemData };
      itemSetData.currAmount -= itemStackSpawn.amount;
      itemSetData.amount -= itemStackSpawn.amount;
      const enBase = world.getDimension(itemRemovedData.dim).spawnItem(
        itemStackSpawn,
        {
          ...itemRemovedData.location,
          y: world.getDimension(itemRemovedData.dim).heightRange.max,
        },
      );
      const itemStackData = config.ItemStackData;
      itemStackData!.set(enBase.id, itemSetData);
      system.run(() => {
        if (!enBase.isValid) return;
        enBase.teleport({
          x: itemRemovedData.location.x,
          y: itemRemovedData.location.y,
          z: itemRemovedData.location.z,
        });
      });
    }
    config.ItemStackData!.delete(itemRemovedData.id);
    if (config.DimensionDataBackUp!.has(itemRemovedData.id)) {
      config.DimensionDataBackUp!.delete(itemRemovedData.id);
    }
  } catch (e) {
    //Why. but is can detect hopper.
    const itemData = config.ItemStackData!.get(itemRemovedData.id) as {
      amount: number;
      item: ItemJson;
      life: number;
      currAmount: number;
      nowAmount: number;
    };
    console.warn((e as Error).message);
    if ((e as Error).message.includes("Trying to")) {
      config.DimensionDataBackUp!.set(itemRemovedData.id, itemData);
      console.info(
        `ItemStacker: Item ${itemRemovedData.id} is in a different dimension, saving data for later.`,
      );
      return;
    }
    system.run(() => {
      const itemStack = ItemConvert.JsonToItem(itemData.item);
      const sizeStack = getSizeStack(
        itemData.amount - itemData.currAmount,
        itemData.amount,
        itemStack.maxAmount,
      );
      const itemStackSpawn = ItemConvert.JsonToItem(itemData.item).clone
        ? ItemConvert.JsonToItem(itemData.item).clone()
        : new ItemStack(itemData.item.typeId, itemData.item.amount);
      sizeStack.forEach((item) => {
        itemStackSpawn.amount = item;
        const enBase = world.getDimension(itemRemovedData.dim).spawnItem(
          ItemConvert.JsonToItem(itemStackSpawn),
          { ...itemRemovedData.location, y: itemRemovedData.location.y + 100 },
        );
        enBase.addTag("fakeItem");
        system.runTimeout(() => {
          if (enBase.isValid) {
            config.ItemListStack.add(enBase);
          }
        }, 40);
      });
    });
    config.ItemStackData!.delete(itemRemovedData.id);
  }
}

export function getSizeStack(
  current: number,
  amount: number,
  maxStack: number,
) {
  const remaining = amount - current;
  return [
    ...Array(Math.floor(remaining / maxStack)).fill(maxStack),
    remaining % maxStack,
  ].filter(Boolean);
}
