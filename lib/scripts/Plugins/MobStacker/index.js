import { EntityDamageCause, EntityEquippableComponent, EquipmentSlot, system, world } from "@minecraft/server";
import Plugins from "../../Class/Plugins";
import CustomEvents from "../../Events/CustomEvent";
import getEntitiesNearBy from "./Functions/GetEntitiesNearBy";
import EntityToName from "./Functions/EntityToName";
import spawnEntityClone from "./Functions/SpawnEntityClone";
import { UnStackMob } from "../ItemStacker/Configs/Database";
import { JsonDatabase } from "../ItemStacker/Configs/con-database";
const allEntities = new Set();
export const resetEntities = new Set();
export default class MobStacker extends Plugins {
    constructor(name) {
        super(name);
        this.name = name;
    }
    setup() {
    }
    init() {
        new CustomEvents(this.name).EntityInteract((ev) => {
            var _a;
            if (ev.target.nameTag && ev.target.nameTag.includes("§m§r§c")) {
                const currAmount = (((_a = ev.target.nameTag) !== null && _a !== void 0 ? _a : "").includes("§m§r§c") ? parseInt(ev.target.nameTag.split("§m§r§c")[1]) : 1);
                system.run(() => {
                    const entityNew = spawnEntityClone(ev.target);
                    ev.target.nameTag = ``;
                    system.runTimeout(() => {
                        if (!ev.target.isValid)
                            return;
                        resetEntities.delete(ev.target);
                    }, 300);
                    resetEntities.add(ev.target);
                    if (currAmount - 1 <= 1)
                        return;
                    entityNew.nameTag = `§e>> §m§r§c${currAmount - 1}§m§r§c§7x§r §7${EntityToName(entityNew)}`;
                });
            }
        });
        new CustomEvents(this.name).EntityDie((ev) => {
            var _a;
            if (ev.damageSource.cause == EntityDamageCause.none || ev.damageSource.cause == EntityDamageCause.selfDestruct)
                return;
            const currAmount = (((_a = ev.deadEntity.nameTag) !== null && _a !== void 0 ? _a : "").includes("§m§r§c") ? parseInt(ev.deadEntity.nameTag.split("§m§r§c")[1]) : 1);
            const MobDeathMode = new JsonDatabase("MobDeathMode", ev.damageSource.damagingEntity);
            if (MobDeathMode.get("mode") == 0) {
                const spawnClone = spawnEntityClone(ev.deadEntity);
                for (let i = 0; i < currAmount; i++) {
                    const { x, y, z } = spawnClone.location;
                    //add random tag
                    const randomTag = Array.from({ length: Math.floor(Math.random() * 13) + 1 }, () => String.fromCharCode(Math.random() < 0.5
                        ? Math.floor(Math.random() * 26) + 65 // A-Z
                        : Math.floor(Math.random() * 26) + 97 // a-z
                    )).join('');
                    const itemHeld = ev.damageSource.damagingEntity.getComponent(EntityEquippableComponent.componentId).getEquipment(EquipmentSlot.Mainhand);
                    console.warn(i, randomTag, itemHeld.typeId);
                    spawnClone.addTag(randomTag);
                    if (itemHeld) {
                        ev.damageSource.damagingEntity.dimension.runCommand(`loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}] ${itemHeld.typeId}`);
                        console.warn(`loot spawn ${Math.round(x)} ${Math.round(y)} ${Math.round(z)} kill @e[tag=${randomTag}] ${itemHeld.typeId}`);
                    }
                    else {
                        spawnClone.dimension.runCommand(`loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
                    }
                }
                spawnClone.remove();
            }
            else if (ev.deadEntity.nameTag && ev.deadEntity.nameTag.includes("§m§r§c")) {
                if (currAmount - 1 <= 0) {
                    return;
                }
                else {
                    const entityNew = spawnEntityClone(ev.deadEntity);
                    if (currAmount - 1 <= 1)
                        return;
                    entityNew.nameTag = `§e>> §m§r§c${currAmount - 1}§m§r§c§7x§r §7${EntityToName(entityNew)}`;
                }
            }
        });
        new CustomEvents(this.name).Tick(40, () => {
            var _a, _b;
            for (const player of world.getPlayers()) {
                const dimid = player.dimension.id;
                allEntities.clear();
                world.getDimension(dimid).getEntities().filter(x => !resetEntities.has(x) &&
                    [...UnStackMob.keys()].some(b => b == x.typeId) &&
                    x.location &&
                    !allEntities.has(x)).forEach(en => {
                    allEntities.add(en);
                });
                for (const entity of allEntities) {
                    let removedAmount = 0;
                    const nearEntities = getEntitiesNearBy(entity.dimension, entity, 10);
                    if (!nearEntities || nearEntities.length === 0) {
                        continue;
                    }
                    for (const target of nearEntities) {
                        const amount = (((_a = target.nameTag) !== null && _a !== void 0 ? _a : "").includes("§m§r§c") ? parseInt(target.nameTag.split("§m§r§c")[1]) : 1);
                        target.dimension.spawnParticle("minecraft:large_explosion", Object.assign(Object.assign({}, target.location), { y: target.location.y + 0.5 }));
                        target.remove();
                        removedAmount += amount;
                    }
                    const currAmount = (((_b = entity.nameTag) !== null && _b !== void 0 ? _b : "").includes("§m§r§c") ? parseInt(entity.nameTag.split("§m§r§c")[1]) : 1);
                    entity.nameTag = `§e>> §m§r§c${removedAmount + currAmount}§m§r§c§7x§r §7${EntityToName(entity)}`;
                    allEntities.clear();
                }
            }
        });
    }
}
//# sourceMappingURL=index.js.map