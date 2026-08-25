// ─── ItemStackingAdapter ──────────────────────────────────────────────────────
//
// Handles the low-level mechanics of item-stack merging and de-stacking.
// Pure logic — no config reading, no job scheduling.
// ─────────────────────────────────────────────────────────────────────────────

import {
  Entity,
  ItemEnchantableComponent,
  ItemStack,
  system,
  Vector3,
  world,
} from "@minecraft/server";
import type { IEntityStorageAdapter } from "../../../api/interfaces/IEntityStorageAdapter.ts";
import type { IStackingAdapter } from "../../../api/interfaces/IStackingAdapter.ts";
import type { IRenderingAdapter } from "../../../api/interfaces/IRenderingAdapter.ts";
import type { StackEntry } from "../types/StackEntry.ts";
import { getSizeStack } from "../utils.ts";

// ─── Item Compatibility Check ─────────────────────────────────────────────────

function canItemsStack(a: ItemStack, b: ItemStack): boolean {
  if (a.nameTag || b.nameTag) return false;
  if (a.typeId !== b.typeId) return false;
  if (a.getLore().join(",") !== b.getLore().join(",")) return false;
  if ([...a.getTags()].sort().join(",") !== [...b.getTags()].sort().join(",")) {
    return false;
  }
  if (
    a.hasComponent("minecraft:potion") || b.hasComponent("minecraft:potion")
  ) return false;
  if (a.hasComponent("minecraft:book") || b.hasComponent("minecraft:book")) {
    return false;
  }
  if (
    a.hasComponent("minecraft:inventory") ||
    b.hasComponent("minecraft:inventory")
  ) return false;

  // Dye colour check
  if (
    a.hasComponent("minecraft:dyeable") && b.hasComponent("minecraft:dyeable")
  ) {
    const ca = a.getComponent("minecraft:dyeable")!.color;
    const cb = b.getComponent("minecraft:dyeable")!.color;
    if (ca && cb && ca !== cb) return false;
  }

  // Enchantment check — must guard asymmetric case (one enchanted, one not)
  const aEnch = a.getComponent(ItemEnchantableComponent.componentId);
  const bEnch = b.getComponent(ItemEnchantableComponent.componentId);
  if (!!aEnch !== !!bEnch) return false;
  if (aEnch && bEnch) {
    const ae = aEnch.getEnchantments();
    const be = bEnch.getEnchantments();
    if (ae.length !== be.length) return false;
    for (let i = 0; i < ae.length; i++) {
      if (ae[i].type.id !== be[i].type.id || ae[i].level !== be[i].level) {
        return false;
      }
    }
  }

  return true;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export class ItemStackingAdapter implements IStackingAdapter {
  constructor(
    private readonly storage: IEntityStorageAdapter,
    private readonly getUnstackList: () => string[],
    private readonly _getRadiusCombine: () => number,
  ) {}

  // ── canStack ────────────────────────────────────────────────────────────────

  canStack(source: Entity, target: Entity): boolean {
    const srcComp = source.getComponent("item");
    const tgtComp = target.getComponent("item");
    if (!srcComp || !tgtComp) return false;

    const srcItem = srcComp.itemStack;
    const tgtItem = tgtComp.itemStack;
    const unstack = this.getUnstackList();

    if (unstack.some((x) => srcItem.typeId.includes(x))) return false;
    if (unstack.some((x) => tgtItem.typeId.includes(x))) return false;

    return canItemsStack(srcItem, tgtItem);
  }

  // ── merge ───────────────────────────────────────────────────────────────────

  /**
   * Absorbs `source` into `target`, summing their logical totals.
   * Removes the source entity from the world.
   */
  merge(source: Entity, target: Entity): void {
    const srcStored = this.storage.getAmount(source);
    const tgtTotal = this.storage.getAmount(target);
    const newTotal = tgtTotal + srcStored;

    this.storage.setAmount(target, newTotal);
    this.storage.delete(source);
    source.addTag("fakeItem");
    source.remove();
  }

  // ── deStack ─────────────────────────────────────────────────────────────────

  /**
   * Called (via system.run) when a stacked item entity is removed from the world.
   * Re-spawns the hidden remainder as new real item entities.
   *
   * The `itemTypeId/itemAmount/itemMaxAmount` are primitive snapshots taken in
   * the Before event handler BEFORE the engine invalidates the entity.
   *
   * Catch-block mirrors the @old hopper-fallback logic:
   *   - "Trying to" error → dimension transfer, save to dimensionBackup.
   *   - Any other error   → spawn remainder at y+100 then re-register them.
   */

  deStack(
    removedId: string,
    location: Vector3,
    dimId: string,
    itemTypeId: string,
    itemAmount: number,
    itemMaxAmount: number,
    _rendering: IRenderingAdapter,
    stackData: Map<string, StackEntry>,
    dimensionBackup: Map<string, StackEntry>,
    pendingStack: Map<string, Entity>,
  ): void {
    // console.warn("DeStaccked");
    const itemData = dimensionBackup.has(removedId)
      ? dimensionBackup.get(removedId)
      : stackData.get(removedId);

    if (!itemData) return;

    // console.warn("DeStaccked 1");

    try {
      const itemToSpawn = itemData.logicalTotal - itemData.nowAmount;
      // console.warn(itemToSpawn);

      if (itemToSpawn > 0) {
        // console.warn("DeStaccked 2");
        const itemStackSpawn = new ItemStack(itemTypeId, itemAmount);
        itemStackSpawn.amount = itemToSpawn <= itemMaxAmount
          ? itemToSpawn
          : itemMaxAmount;

        const itemSetData = { ...itemData };
        itemSetData.logicalTotal = itemToSpawn;
        itemSetData.nowAmount = itemStackSpawn.amount;
        itemSetData.lifeTick = system.currentTick;

        const maxHt = world.getDimension(dimId).heightRange.max;
        const enBase = world.getDimension(dimId).spawnItem(itemStackSpawn, {
          x: location.x,
          y: Math.min(location.y + 100, maxHt - 2),
          z: location.z,
        });

        // Tag as fakeItem during the 1-tick gap before teleport to prevent
        // combineItemStack() from absorbing this entity before it's registered.
        enBase.addTag("fakeItem");
        stackData.set(enBase.id, itemSetData);
        this.storage.setAmount(enBase, itemToSpawn);

        system.run(() => {
          if (!enBase.isValid) return;
          enBase.removeTag("fakeItem");
          enBase.clearVelocity();
          enBase.teleport({
            x: location.x,
            y: location.y + 0.5,
            z: location.z,
          });
          console.warn(
            `[ItemStacker] deStack success! Spawned ${itemStackSpawn.amount} items (Remaining: ${itemToSpawn}).`,
          );
        });
      }

      stackData.delete(removedId);
      if (dimensionBackup.has(removedId)) {
        dimensionBackup.delete(removedId);
      }
    } catch (e) {
      // Minecraft throws when spawning items during dimension transfer.
      // "Trying to" prefix distinguishes that from a hopper/generic error.
      console.warn((e as Error).message);
      if ((e as Error).message.includes("Trying to")) {
        dimensionBackup.set(removedId, itemData);
        console.info(
          `ItemStacker: Item ${removedId} is in a different dimension, saving data for later.`,
        );
        return;
      }

      // getSizeStack(current, total, max) → splits (total - current) into chunks.
      // nowAmount is the portion already on the entity; the rest needs re-spawning.
      const sizeStack = getSizeStack(
        itemData.nowAmount,
        itemData.logicalTotal,
        itemMaxAmount,
      );
      const maxHt = world.getDimension(dimId).heightRange.max;
      const itemStackSpawn = new ItemStack(itemTypeId, itemAmount);

      sizeStack.forEach((item) => {
        itemStackSpawn.amount = item;
        const enBase = world.getDimension(dimId).spawnItem(itemStackSpawn, {
          x: location.x,
          y: Math.min(location.y + 100, maxHt - 2),
          z: location.z,
        });
        enBase.clearVelocity();
        enBase.addTag("fakeItem");
        system.runTimeout(() => {
          if (enBase.isValid) {
            enBase.removeTag("fakeItem");
            pendingStack.set(enBase.id, enBase);
          }
        }, 40);
      });

      stackData.delete(removedId);
    }
  }

  // ── split ───────────────────────────────────────────────────────────────────

  /**
   * Splits `amount` items off `target`, creating a new entity.
   * Returns the new entity or null if not enough items.
   */
  split(target: Entity, amount: number): Entity | null {
    const total = this.storage.getAmount(target);
    if (total <= amount) return null;

    const itemComp = target.getComponent("item");
    if (!itemComp) return null;

    const remaining = total - amount;
    this.storage.setAmount(target, remaining);

    const src = itemComp.itemStack;
    const clone = src.clone ? src.clone() : new ItemStack(src.typeId, amount);
    clone.amount = 1;
    const spawned = target.dimension.spawnItem(clone, target.location);
    this.storage.setAmount(spawned, amount);
    return spawned;
  }
}
