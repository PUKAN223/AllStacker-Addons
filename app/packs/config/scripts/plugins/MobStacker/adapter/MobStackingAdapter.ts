import {
  Dimension,
  Entity,
  EntityIsBabyComponent,
  EntityLeashableComponent,
  EntityScaleComponent,
} from "@minecraft/server";
import type { IStackingAdapter } from "../../../api/interfaces/IStackingAdapter.ts";
import type { IEntityStorageAdapter } from "../../../api/interfaces/IEntityStorageAdapter.ts";

// ─────────────────────── helpers ──────────────────────

export function entityToName(en: Entity): string {
  return en.typeId
    .split(":")[1]
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Spawns a clone of an entity preserving colour + baby state.
 * Port of the old spawnEntityClone util.
 */
export function spawnEntityClone(en: Entity): Entity {
  const clone = en.dimension.spawnEntity(en.typeId, en.location);
  if (en.hasComponent("color") && clone.hasComponent("color")) {
    clone.getComponent("color")!.value = en.getComponent("color")!.value;
  }
  if (en.hasComponent(EntityIsBabyComponent.componentId)) {
    try { clone.triggerEvent("minecraft:entity_born"); } catch { /* ok */ }
  }
  return clone;
}

/** Returns entities near `en` that qualify for stacking with it. */
export function getEntitiesNearBy(
  dimension: Dimension,
  en: Entity,
  radius: number,
  stackList: string[],
  resetEntities: Set<string>,
): Entity[] {
  if (!stackList.includes(en.typeId)) return [];

  return dimension
    .getEntities({ location: en.location, maxDistance: radius, type: en.typeId })
    .filter((x) => x.id !== en.id)
    .filter((x) => !resetEntities.has(x.id))
    .filter((x) => x.hasComponent("is_baby") === en.hasComponent("is_baby"))
    .filter((x) => !x.hasComponent("is_tamed"))
    .filter((x) => {
      const lc = x.getComponent(EntityLeashableComponent.componentId) as EntityLeashableComponent | undefined;
      return !(lc && lc.leashHolder);
    })
    .filter((x) => x.getComponent("color")?.value === en.getComponent("color")?.value)
    .filter((x) => {
      const sc = x.getComponent(EntityScaleComponent.componentId) as EntityScaleComponent | undefined;
      const es = en.getComponent(EntityScaleComponent.componentId) as EntityScaleComponent | undefined;
      if (!sc) return true;
      return sc.value === es?.value;
    });
}

// ─────────────────────── adapter ──────────────────────

export class MobStackingAdapter implements IStackingAdapter {
  constructor(
    private readonly storage: IEntityStorageAdapter,
    private readonly getStackList: () => string[],
    private readonly getRadius: () => number,
    private readonly resetEntities: Set<string>,
  ) {}

  canStack(source: Entity, target: Entity): boolean {
    if (source.typeId !== target.typeId) return false;
    if (!this.getStackList().includes(source.typeId)) return false;
    if (this.resetEntities.has(source.id) || this.resetEntities.has(target.id)) return false;

    // Do not stack tamed entities
    if (source.hasComponent("is_tamed") || target.hasComponent("is_tamed")) return false;

    // Must match baby/adult state
    if (source.hasComponent("is_baby") !== target.hasComponent("is_baby")) return false;

    // Must not be leashed
    const srcLeash = source.getComponent(EntityLeashableComponent.componentId) as EntityLeashableComponent | undefined;
    const tgtLeash = target.getComponent(EntityLeashableComponent.componentId) as EntityLeashableComponent | undefined;
    if ((srcLeash && srcLeash.leashHolder) || (tgtLeash && tgtLeash.leashHolder)) return false;

    // Must match colour
    if (source.getComponent("color")?.value !== target.getComponent("color")?.value) return false;

    return true;
  }

  merge(source: Entity, target: Entity): void {
    const srcAmount = this.storage.getAmount(source);
    const tgtAmount = this.storage.getAmount(target);
    this.storage.setAmount(target, tgtAmount + srcAmount);
    this.storage.delete(source);
    source.addTag("fakeMob");
    source.remove();
    // Prevent Minecraft from despawning the merged stack.
    // The Bedrock Script API has no setPersistence(); a non-empty nameTag
    // is the vanilla mechanism that stops natural despawning.
    if (!target.nameTag) target.nameTag = "\u200B"; // zero-width space
  }

  split(target: Entity, amount: number): Entity | null {
    const total = this.storage.getAmount(target);
    if (amount >= total) return null;
    const remaining = total - amount;
    this.storage.setAmount(target, remaining);
    const clone = spawnEntityClone(target);
    this.storage.setAmount(clone, amount);
    return clone;
  }
}
