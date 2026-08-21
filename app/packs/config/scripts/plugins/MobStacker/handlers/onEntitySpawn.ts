// ─── MobStacker › handlers › onEntitySpawn ────────────────────────────────────

import { EntityComponentTypes, EntitySpawnAfterEvent, system } from "@minecraft/server";
import type { IEntityStorageAdapter } from "../../../api/interfaces/IEntityStorageAdapter.ts";
import { DynamicPropertyStorageAdapter } from "../../../api/adapters/DynamicPropertyStorageAdapter.ts";
import type { ConfigProvider } from "../config/ConfigProvider.ts";
import { getCfgArr } from "../config/helpers.ts";

export interface SpawnCtx {
  storage: IEntityStorageAdapter;
  plugin: ConfigProvider;
}

export function onEntitySpawn(ev: EntitySpawnAfterEvent, ctx: SpawnCtx): void {
  const entity = ev.entity;
  if (!entity.isValid) return;
  if (entity.hasTag("multipliedEgg")) return;

  // Check if spawned entity is an item
  if (entity.typeId !== "minecraft:item") return;

  // Get the item stack inside the item entity
  const itemComp = entity.getComponent(EntityComponentTypes.Item) as {
    itemStack?: { typeId: string; amount: number };
  };
  if (!itemComp || !itemComp.itemStack) return;

  // Check if the item is an egg
  if (itemComp.itemStack.typeId !== "minecraft:egg") return;

  const stackList = getCfgArr(ctx.plugin, "StackMob");
  if (!stackList.includes("minecraft:chicken")) return;

  // Check if there is a chicken nearby (radius 1)
  const loc = entity.location;
  const dim = entity.dimension;
  const chickens = dim.getEntities({
    location: loc,
    maxDistance: 1.5,
    type: "minecraft:chicken",
  });

  if (chickens.length === 0) return;

  // Get the nearest chicken (or first one)
  const chicken = chickens[0];
  const amount = ctx.storage.getAmount(chicken);

  // console.info("Egg Detect", amount);

  if (amount > 1) {
    // ─ Defer by 1 tick so ItemStacker's spawn handler runs first
    //   (both listen on AfterEntitySpawn). After ItemStacker pushes the egg
    //   into pendingStack, we overwrite the DynamicProperty so the stacking
    //   loop will see the correct multiplied count.
    system.run(() => {
      if (!entity.isValid) return;
      const itemStorage = new DynamicPropertyStorageAdapter("ItemStackAmount");
      itemStorage.setAmount(entity, amount);
      entity.addTag("multipliedEgg"); // prevent double-processing on next spawn event
    });
  }
}
