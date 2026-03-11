import { PlayerUtils, PluginBase } from "@axeth/api";
import { Entity, ItemStack, Player, system } from "@minecraft/server";
import { CollectType, type CropOptions } from "../types/CropOptions.ts";


class FarmCropManagers {
    public plugin: PluginBase;
    private crops: Map<string, CropOptions> = new Map();
    private cropsData = new Map<string, Crops>();


    private constructor(plugin: PluginBase) {
        this.plugin = plugin;

        this.onTick();
    }

    static initialize(plugin: PluginBase) {
        return new FarmCropManagers(plugin);
    }

    private onTick() {
    }

    get getCropsData() {
        return this.crops;
    }

    public registerCropType(cropType: string, options: CropOptions) {
        this.crops.set(cropType, options);
    }

    public getCropOptions(cropType: string): CropOptions | null {
        return this.crops.get(cropType) || null;
    }

    public getCrops(cropsTarget: Entity): Crops | null {
        if (this.cropsData.has(cropsTarget.id)) {
            return this.cropsData.get(cropsTarget.id)!;
        }
        const options = this.getCropOptions(cropsTarget.typeId);
        if (options) {
            const crop = new Crops(cropsTarget, options, this);
            this.cropsData.set(cropsTarget.id, crop);
            return crop;
        }
        return null;
    }

    public resetCrops(cropsTarget: Entity) {
        if (this.cropsData.has(cropsTarget.id)) {
            this.cropsData.delete(cropsTarget.id);
        }
    }
}

class Crops {
    private cropsTarget: Entity;
    private options: CropOptions
    private cropsManagers: FarmCropManagers;

    private lastCrosshairPos: { x: number; y: number; z: number } | null = null;
    private lastHitTick: number = 0;
    private hitCount: number = 0;

    private readonly cooldownDebounceTicks: number = 10;

    private nextGrowthTicks = 0;

    constructor(cropsTarget: Entity, options: CropOptions, crops: FarmCropManagers) {
        this.cropsTarget = cropsTarget;
        this.options = options;
        this.cropsManagers = crops;

        this.lastHitTick = this.nowTick;
    }

    get health(): number {
        return this.cropsTarget.getComponent("health")?.currentValue || 0;
    }

    get isCanHarvest(): boolean {
        if (this.hitCount <= 0) return true;
        return this.nowTick - this.lastHitTick > this.cooldownDebounceTicks && this.nowTick - this.nextGrowthTicks >= 0;
    }

    get isGrown(): boolean {
        return this.nowTick - this.nextGrowthTicks > 0;
    }

    get isExpired(): boolean {
        return this.nowTick - this.lastHitTick > this.options.expireTicks;
    }

    get nowTick(): number {
        return this.cropsManagers.plugin.system.currentTick;
    }

    public async harvest(player: Player) {
        const cropInfo = this.cropsManagers.getCropOptions(this.cropsTarget.typeId);
        if (!cropInfo) return;
        try {
            if (cropInfo.collectType === CollectType.Cursor) {
                if (!this.isGrown) return;
                if (!this.isCanHarvest) return;
                if (this.isExpired) {
                    this.cropsManagers.resetCrops(this.cropsTarget);
                    await this.destroyCrosshair();
                    return;
                }

                if (this.hitCount === 0) {
                    this.consumeDurability(player, cropInfo) && await this.handleSuccessfulHit(player, CollectType.Cursor, true);
                    return;
                }

                if (this.isAimAtCrosshair(player)) {
                    await this.handleSuccessfulHit(player, CollectType.Cursor);
                } else {
                    await this.handleMiss(player);
                }
            } else if (cropInfo.collectType === CollectType.RepeatHit) {
                if (!this.isGrown) return;
                if (!this.isCanHarvest) return;
                if (this.isExpired) {
                    this.cropsManagers.resetCrops(this.cropsTarget);
                    return;
                }
                this.consumeDurability(player, cropInfo) && await this.handleSuccessfulHit(player, CollectType.RepeatHit);
            }
        } catch (error) {
            this.cropsManagers.plugin.logger.error(`Error during harvesting: ${error}`);
        }
    }

    private consumeDurability(player: Player, cropInfo: CropOptions): boolean {
        if (cropInfo.tool && cropInfo.tool.length > 0) {
            const heldItem = player.getComponent("inventory")?.container.getItem(player.selectedSlotIndex);
            if (!heldItem || !cropInfo.tool.find(t => t.type === heldItem.typeId)) {
                cropInfo.tool.forEach(t => {
                    PlayerUtils.sendToast(
                        player,
                        ``,
                        `§cต้องใช้เครื่องมือ: §e${t.name} §cในการเก็บเกี่ยว`,
                        t.texture
                    )
                    player.playSound("mob.villager.no", { volume: 1, pitch: 1 });
                });
                return false;
            }
            const damage = heldItem.getComponent("durability")!.damage;
            if (damage >= heldItem.getComponent("durability")!.maxDurability) {
                player.getComponent("inventory")?.container.setItem(player.selectedSlotIndex, undefined);
                player.playSound("random.break", { volume: 1, pitch: 1 });
                return false;
            } else {
                heldItem.getComponent("durability")!.damage += 1;
                player.getComponent("inventory")?.container.setItem(player.selectedSlotIndex, heldItem);
                return true;
            }
        }
        return true;
    }

    private async handleSuccessfulHit(player: Player, collectType: CollectType, refreshCrosshair: boolean = false) {
        this.playHitEffects(player);
        this.adjustHitCount(1);
        this.lastHitTick = this.nowTick;
        if ((await this.updateHealth(false, player)) === null) return;
        if (collectType === CollectType.Cursor) {
            if (refreshCrosshair) {
                await this.destroyCrosshair();
            }
            this.initCrosshair();
        }
    }

    private async handleMiss(player: Player) {
        player.playSound("note.bit", { volume: 2, pitch: 1 });
        this.adjustHitCount(-1);
        if ((await this.updateHealth(true, player)) === null) return;
        this.lastHitTick = this.nowTick;
        await this.destroyCrosshair();
        this.initCrosshair();
    }

    private adjustHitCount(delta: number) {
        const healthComp = this.cropsTarget.getComponent("health");
        const maxHits = healthComp
            ? Math.max(1, Math.ceil(healthComp.effectiveMax / Math.max(this.options.yieldAmount, 1)))
            : Number.MAX_SAFE_INTEGER;
        this.hitCount = Math.min(Math.max(0, this.hitCount + delta), maxHits);
    }

    private playHitEffects(player: Player) {
        player.playSound("mob.sheep.shear", { volume: 1, pitch: 1 });
        this.cropsTarget.playAnimation("animation.lettuce.hit");
        this.cropsTarget.dimension.spawnParticle("kisu:harvest", this.cropsTarget.location);
    }

    private collect(pl: Player) {
        this.cropsTarget.dimension.playSound("dig.grass", this.cropsTarget.location, { volume: 2, pitch: 1 });
        this.options.loot.forEach(lootItem => {
            const amount = Math.floor(Math.random() * (lootItem.amount.max - lootItem.amount.min + 1)) + lootItem.amount.min;
            const lootSpawn = this.cropsTarget.dimension.spawnItem(
                new ItemStack(lootItem.type, amount),
                this.cropsTarget.location
            );
            lootSpawn.applyImpulse(
                {
                    x: (Math.random() - 0.3) * 0.2,
                    y: Math.random() * 0.2,
                    z: (Math.random() - 0.3) * 0.2,
                }
            )
            PlayerUtils.sendToast(
                pl,
                `§aเก็บเกี่ยวสำเร็จ`,
                `§7ได้รับ §e${this.options.name} §7x§c${amount}§r`,
                this.options.icon
            )
        });
        this.cropsTarget.remove();
    }

    private async updateHealth(isMiss: boolean, pl: Player) {
        const healthComp = this.cropsTarget.getComponent("health");
        if (!healthComp) return;
        const currentHealth = Math.max(healthComp.effectiveMax - (this.hitCount * this.options.yieldAmount), 0);
        if (currentHealth <= 0) {
            await this.destroyCrosshair();
            this.collect(pl);
            return null;
        }
        healthComp.setCurrentValue(currentHealth);
        const maxChar = 7;
        const healthPercent = (healthComp.currentValue / healthComp.effectiveMax) * 100;
        const filledCharCount = Math.floor((healthPercent / 100) * maxChar);
        const emptyCharCount = maxChar - filledCharCount;

        const healthBar = `${this.cropsManagers.plugin.mcColors(this.options.name).yellow}\n` + this.cropsManagers.plugin.mcColors(isMiss ? "" : "").green.repeat(emptyCharCount) + this.cropsManagers.plugin.mcColors("".repeat(filledCharCount)).grey + ` `;
        this.cropsTarget.nameTag = healthBar;
        system.runTimeout(() => {
            if (!this.cropsTarget.isValid) return
            this.cropsTarget.nameTag = ``
        }, 15)
        return true
    }

    private isAimAtCrosshair(player: Player): boolean {
        if (!this.lastCrosshairPos) return false;
        const lookPos = player.getViewDirection();

        for (let d = 0; d < 10; d += 0.5) {
            const checkPos = {
                x: player.getHeadLocation().x + lookPos.x * d,
                y: player.getHeadLocation().y + lookPos.y * d,
                z: player.getHeadLocation().z + lookPos.z * d,
            };
            const distance = Math.sqrt(
                (checkPos.x - this.lastCrosshairPos.x) ** 2 +
                (checkPos.y - this.lastCrosshairPos.y) ** 2 +
                (checkPos.z - this.lastCrosshairPos.z) ** 2,
            );
            if (distance < 0.5) {
                return true;
            }
        }
        return false;
    }

    private async initCrosshair() {
        // Always destroy any previous crosshair before creating a new one
        if (this.lastCrosshairPos) {
            await this.destroyCrosshair();
        }
        const collision = this.cropsTarget.getAABB();
        const margin = 0.1;
        const spread = {
            x: Math.max(0, collision.extent.x - margin) * 2,
            y: Math.max(0, collision.extent.y - margin - 0.6) * 2,
            z: Math.max(0, collision.extent.z - margin) * 2,
        };
        const randomCrosshair = {
            x: collision.center.x + (Math.random() - 0.5) * spread.x,
            y: collision.center.y + (Math.random() - 0.5) * spread.y,
            z: collision.center.z + (Math.random() - 0.5) * spread.z,
        };
        this.lastCrosshairPos = randomCrosshair;
        this.cropsTarget.dimension.spawnParticle("kisu:crosshair", randomCrosshair);
    }

    private async destroyCrosshair() {
        if (!this.lastCrosshairPos) return;
        const position = this.lastCrosshairPos;
        const blockPos = {
            x: Math.floor(position.x),
            y: Math.floor(position.y),
            z: Math.floor(position.z),
        };

        return await new Promise<void>((resolve) => {
            try {
                const dimension = this.cropsManagers.plugin.world.getDimension(this.cropsTarget.dimension.id);
                dimension.setBlockType(blockPos, "minecraft:structure_void");
                dimension.setBlockType(
                    { ...blockPos, y: blockPos.y + 1 },
                    "minecraft:structure_void",
                );

                this.cropsManagers.plugin.system.runTimeout(() => {
                    dimension.setBlockType(
                        { ...blockPos, y: blockPos.y + 1 },
                        "minecraft:air",
                    );
                    dimension.setBlockType(blockPos, "minecraft:air");
                    this.cropsManagers.plugin.system.runTimeout(() => resolve(), 10);
                }, 5);
            } catch (error) {
                this.cropsManagers.plugin.logger.error(`Failed to destroy crosshair: ${error}`);
                resolve();
            } finally {
                this.lastCrosshairPos = null;
            }
        });
    }
}

export { FarmCropManagers };