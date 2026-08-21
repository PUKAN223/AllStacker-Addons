import type { Entity } from "@minecraft/server";
import type { IEntityStorageAdapter } from "../interfaces/IEntityStorageAdapter.ts";

/**
 * Stores stack amounts via native Minecraft DynamicProperties.
 * No serialisation overhead; survives reload if the world autosaves.
 */
export class DynamicPropertyStorageAdapter implements IEntityStorageAdapter {
  constructor(private readonly propertyKey: string = "StackingAmount") {}

  getAmount(entity: Entity): number {
    if (!entity.isValid) return 1;
    
    // 1. Try DynamicProperty
    const v = entity.getDynamicProperty(this.propertyKey);
    if (typeof v === "number" && v >= 1) return v;

    // 2. Fallback to Tags (Extremely reliable for items across reloads)
    const tagPrefix = `${this.propertyKey}:`;
    const amtTag = entity.getTags().find((t) => t.startsWith(tagPrefix));
    if (amtTag) {
      const parsed = parseInt(amtTag.substring(tagPrefix.length), 10);
      if (!isNaN(parsed) && parsed >= 1) return parsed;
    }
    
    return 1;
  }

  setAmount(entity: Entity, amount: number): void {
    if (!entity.isValid) return;
    
    // 1. Dynamic Property
    entity.setDynamicProperty(this.propertyKey, amount);
    
    // 2. Tag persistence
    const tagPrefix = `${this.propertyKey}:`;
    const oldTags = entity.getTags().filter((t) => t.startsWith(tagPrefix));
    for (const t of oldTags) entity.removeTag(t);
    entity.addTag(`${tagPrefix}${amount}`);
  }

  delete(entity: Entity): void {
    if (!entity.isValid) return;
    
    entity.setDynamicProperty(this.propertyKey, undefined);
    
    const tagPrefix = `${this.propertyKey}:`;
    const oldTags = entity.getTags().filter((t) => t.startsWith(tagPrefix));
    for (const t of oldTags) entity.removeTag(t);
  }
}
