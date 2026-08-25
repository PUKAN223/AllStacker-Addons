// ─── ItemStacker: Combine/Merge Logic ────────────────────────────────────────

import { Entity, system } from "@minecraft/server";
import type { IEntityStorageAdapter } from "../../../api/interfaces/IEntityStorageAdapter.ts";
import type { ItemStackingAdapter } from "../adapter/ItemStackingAdapter.ts";
import type { StackEntry } from "../types/StackEntry.ts";
import type { ConfigProvider } from "../config/ConfigProvider.ts";
import { getCfgArr, getCfgNum } from "../config/helpers.ts";

export function combineItemStack(
  en: Entity,
  storage: IEntityStorageAdapter,
  stackData: Map<string, StackEntry>,
  pendingStack: Map<string, Entity>,
  adapter: ItemStackingAdapter,
  plugin: ConfigProvider,
): void {
  if (!en.isValid) return;
  const itemComp = en.getComponent("item");
  if (!itemComp) return;

  const item = itemComp.itemStack;
  const unstackArr = getCfgArr(plugin, "UnStackList");
  const isUnstackable = (typeId: string) => unstackArr.some((x) => typeId.includes(x));

  // ── Reload restore
  const persistedAmount = storage.getAmount(en);
  if (persistedAmount > 1) {
    stackData.set(en.id, {
      logicalTotal: persistedAmount,
      lifeTick: stackData.get(en.id)?.lifeTick ?? system.currentTick,
      nowAmount: item.amount,
      dimId: en.dimension.id,
      typeId: item.typeId,
      maxAmount: item.maxAmount,
    });
    pendingStack.delete(en.id);
    return;
  }

  // ── Unstackable items
  if (
    item.nameTag ||
    item.typeId.includes("potion") ||
    item.typeId.includes("shulker_box") ||
    item.typeId.includes("bundle") ||
    item.typeId.includes("bed") ||
    item.typeId.includes("bottle") ||
    isUnstackable(item.typeId)
  ) {
    storage.setAmount(en, item.amount);
    stackData.set(en.id, {
      logicalTotal: item.amount,
      lifeTick: system.currentTick,
      nowAmount: item.amount,
      dimId: en.dimension.id,
      typeId: item.typeId,
      maxAmount: item.maxAmount,
    });
    pendingStack.delete(en.id);
    return;
  }

  // ── Merge: collect all matching nearby stacked items into this one.
  const radius = getCfgNum(plugin, "RadiusCombine", 15);
  const nearBy = en.dimension
    .getEntities({
      location: en.location,
      maxDistance: radius,
      type: "minecraft:item",
    })
    .filter((target: Entity) => {
      if (target.id === en.id || !target.isValid || target.hasTag("fakeItem")) {
        return false;
      }
      if (!stackData.has(target.id) && !pendingStack.has(target.id)) return false;
      const tComp = target.getComponent("item");
      if (!tComp) return false;
      if (isUnstackable(tComp.itemStack.typeId)) return false;
      return adapter.canStack(en, target);
    });

  let total = item.amount;
  for (const target of nearBy) {
    let targetAmount = 0;
    
    if (stackData.has(target.id)) {
      targetAmount = stackData.get(target.id)!.logicalTotal;
      stackData.delete(target.id);
    } else if (pendingStack.has(target.id)) {
      const pAmt = storage.getAmount(target);
      targetAmount = pAmt > 1 ? pAmt : target.getComponent("item")!.itemStack.amount;
      pendingStack.delete(target.id);
    } else {
      continue;
    }

    total += targetAmount;
    target.addTag("fakeItem");
    target.remove();
  }

  storage.setAmount(en, total);
  stackData.set(en.id, {
    logicalTotal: total,
    lifeTick: system.currentTick,
    nowAmount: item.amount,
    dimId: en.dimension.id,
    typeId: item.typeId,
    maxAmount: item.maxAmount,
  });
  pendingStack.delete(en.id);
}
