import { world, system, EntityComponentTypes, EquipmentSlot, Entity, ItemStack, type Vector3, ProjectileHitEntityAfterEvent } from '@minecraft/server';

export const FishingResult = Object.freeze({
    None: 'none',
    Missed: 'missed',
    Success: 'success',
    AttachedToEntity: 'attachedToEntity'
});

interface FishingData {
    player: Entity | null;
    itemStack?: ItemStack | null;
    fishingHook?: Entity | null;
    beforeItemStack?: ItemStack | null;
    attachedToEntity?: Entity | null;
    fishingInfo?: {
        result: string;
        fishedItems: ItemStack[];
        location: Vector3 | null;
        duration: number;
    }
}

class FishingEventInstance {
    public hook: Entity;
    private hookLocation: Vector3 | null = null;
    private isInWater = false;
    private hookTime: number;
    private removedTime: number | null = null;
    private source: Entity | null = null;
    private beforeItemStack: ItemStack | null = null;
    private spawnedItems: ItemStack[] = [];
    private attachedToEntity: Entity | null = null;
    private fishingResult: string = FishingResult.None;

    private run: number | null = null;
    private initialized: boolean = false;

    constructor(hook: Entity) {
        this.hook = hook;
        this.hookTime = system.currentTick;
        system.runTimeout(() => { if (!this.hook || !this.source) this.cleanup(); }, 5);
    }
    setSource(player: Entity) {
        if (this.source || system.currentTick - this.hookTime > 5) return;
        this.source = player;
        this.beforeItemStack = this.source.getComponent(EntityComponentTypes.Equippable)!.getEquipment(EquipmentSlot.Mainhand) ?? null;
        this.startLoop();
    }
    setAttachedEntity(entity: Entity) {
        this.attachedToEntity = entity;
    }
    manageLoot(entity: Entity) {
        if (!this.hook.isValid && this.removedTime !== null && system.currentTick - this.removedTime <= 5
            && this.hookLocation && Math.abs(entity.location.x - this.hookLocation.x) <= 2.5 && Math.abs(entity.location.z - this.hookLocation.z) <= 2.5
        ) this.spawnedItems.push(
            entity.getComponent('minecraft:item')!.itemStack
        );
    }
    startLoop() {
        if (!this.initialized) {
            this.initialized = true;
            if (FishingEvent['playerStartFishing'].subscribers.size) {
                FishingEventManager.triggerEvent({
                    player: this.source,
                    itemStack: this.beforeItemStack,
                    fishingHook: this.hook
                }, 'playerStartFishing');
            }
            if (!FishingEvent['playerReleaseFishing'].subscribers.size) this.cleanup();
        }
        this.run = system.runInterval(() => {
            if (this.hook?.isValid) {
                if (!this.isInWater) this.isInWater = this.hook.isInWater;
                this.hookLocation = this.hook.location;
                return;
            }
            if (!this.removedTime) system.runTimeout(() => {
                this.fishingResult = this.attachedToEntity ? FishingResult.AttachedToEntity
                    : this.spawnedItems.length ? FishingResult.Success
                        : this.isInWater ? FishingResult.Missed
                            : FishingResult.None;
                FishingEventManager.triggerEvent({
                    player: this.source,
                    beforeItemStack: this.beforeItemStack,
                    attachedToEntity: this.attachedToEntity,
                    fishingInfo: {
                        result: this.fishingResult,
                        fishedItems: this.spawnedItems,
                        location: this.hookLocation,
                        duration: system.currentTick - this.hookTime
                    }
                }, 'playerReleaseFishing'); this.cleanup();
            }, 1);
            this.removedTime = system.currentTick;
        });
    }
    cleanup() { if (this.run) { system.clearRun(this.run); } FishingEventManager.removeInstance(this); }
}

class FishingEventManager {
    static _activeInstances: Set<FishingEventInstance> = new Set();
    static _entitySpawnCallback = ({ entity }: { entity: Entity }) => {
        if (!entity?.isValid) return;
        if (entity.typeId === 'minecraft:fishing_hook') FishingEventManager._activeInstances.add(new FishingEventInstance(entity));
        else if (entity.hasComponent(EntityComponentTypes.Item)) FishingEventManager._activeInstances.forEach(inst => inst.manageLoot(entity));
    }
    static _itemUseCallback = ({ source, itemStack }: { source: Entity, itemStack: ItemStack }) => {
        if (source?.isValid && itemStack.typeId === 'minecraft:fishing_rod') { for (const inst of FishingEventManager._activeInstances) inst.setSource(source); }
    }
    static _projectileHitEntityCallback = (data: ProjectileHitEntityAfterEvent) => {
        const { entity } = data.getEntityHit();
        if (!entity?.isValid) return;
        if (!data.projectile.isValid || !entity.isValid) return;
        for (const inst of FishingEventManager._activeInstances) if (inst.hook?.id === data.projectile?.id) inst.setAttachedEntity(entity);
    }
    static triggerEvent(data: FishingData, eventName: keyof FishingEvents) { 
        FishingEvent[eventName].subscribers.forEach(cb => cb(data)); 
    }
    static removeInstance(instance: FishingEventInstance) { FishingEventManager._activeInstances.delete(instance); }
    static _updateSubscriptions(eventName: keyof FishingEvents) {
        if (!FishingEvent[eventName].subscribers.size && !FishingEventManager._activeInstances.size) {
            world.afterEvents.entitySpawn.unsubscribe(FishingEventManager._entitySpawnCallback);
            world.afterEvents.itemUse.unsubscribe(FishingEventManager._itemUseCallback);
            if (eventName !== 'playerStartFishing') world.afterEvents.projectileHitEntity.unsubscribe(FishingEventManager._projectileHitEntityCallback);
        } else {
            world.afterEvents.entitySpawn.subscribe(FishingEventManager._entitySpawnCallback);
            world.afterEvents.itemUse.subscribe(FishingEventManager._itemUseCallback);
            if (eventName !== 'playerStartFishing') world.afterEvents.projectileHitEntity.subscribe(FishingEventManager._projectileHitEntityCallback);
        }
    }
}

class FishingEvents {
    #createEvent(eventName: keyof FishingEvents) {
        return {
            subscribers: new Set<(data: FishingData) => void>(),
            subscribe: (cb: (data: FishingData) => void) => {
                this[eventName].subscribers.add(cb);
                FishingEventManager._updateSubscriptions(eventName); return cb;
            },
            unsubscribe: (cb: (data: FishingData) => void) => {
                this[eventName].subscribers.delete(cb);
                FishingEventManager._updateSubscriptions(eventName);
            }
        }
    }
    playerStartFishing = this.#createEvent('playerStartFishing');
    playerReleaseFishing = this.#createEvent('playerReleaseFishing');
}

export const FishingEvent = new FishingEvents();