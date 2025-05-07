import { EntityDieAfterEvent, EntityRemoveBeforeEvent, EntitySpawnAfterEvent, ItemUseAfterEvent, ItemUseAfterEventSignal, PlayerInteractWithEntityBeforeEvent, world } from "@minecraft/server";
import CustomEntitySpawned from "./EntitySpawned";
import CustomTick from "./Tick";
import CustomEntityRemoved from "./EntityRemoved";
import CustomEntityDie from "./EntityDie";
import CustomEntityInteract from "./InteractEntity";
import CustomItemUse from "./ItemUse";

export default class CustomEvents {
  private name: string
  constructor(name: string) {
    this.name = name;
  }

  public EntitySpawned(callback: (ev: EntitySpawnAfterEvent) => void) {
    new CustomEntitySpawned(this.name, callback)
  }

  public EntityRemoved(callback: (ev: EntityRemoveBeforeEvent) => void) {
    new CustomEntityRemoved(this.name, callback)
  }

  public EntityDie(callback: (ev: EntityDieAfterEvent) => void) {
    new CustomEntityDie(this.name, callback)
  }

  public EntityInteract(callback: (ev: PlayerInteractWithEntityBeforeEvent) => void) {
    new CustomEntityInteract(this.name, callback)
  }

  public Tick(delay: number, callback: () => void) {
    new CustomTick(this.name, delay, callback)
  }

  public ItemUse(callback: (ev: ItemUseAfterEvent) => void) {
    new CustomItemUse(this.name, callback);
  } 
}