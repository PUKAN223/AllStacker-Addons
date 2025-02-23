import { EntityDamageCause, MinecraftDimensionTypes, system, world } from "@minecraft/server";
import Plugins from "../../Class/Plugins";
import CustomEvents from "../../Events/CustomEvent";
import getEntitiesNearBy from "./Functions/GetEntitiesNearBy";
import { MobStackList } from "./Configs/MobStackList";
import EntityToName from "./Functions/EntityToName";
import spawnEntityClone from "./Functions/SpawnEntityClone";
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
                        if (!ev.target.isValid())
                            return;
                        resetEntities.delete(ev.target);
                    }, 100);
                    resetEntities.add(ev.target);
                    if (currAmount - 1 <= 0)
                        return;
                    entityNew.nameTag = `§e>> §m§r§c${currAmount - 1}§m§r§c§7x§r §7${EntityToName(entityNew)}`;
                });
            }
        });
        new CustomEvents(this.name).EntityDie((ev) => {
            var _a;
            if (ev.damageSource.cause == EntityDamageCause.none || ev.damageSource.cause == EntityDamageCause.selfDestruct)
                return;
            if (ev.deadEntity.nameTag && ev.deadEntity.nameTag.includes("§m§r§c")) {
                const currAmount = (((_a = ev.deadEntity.nameTag) !== null && _a !== void 0 ? _a : "").includes("§m§r§c") ? parseInt(ev.deadEntity.nameTag.split("§m§r§c")[1]) : 1);
                if (currAmount - 1 <= 0) {
                    return;
                }
                else {
                    const entityNew = spawnEntityClone(ev.deadEntity);
                    entityNew.nameTag = `§e>> §m§r§c${currAmount - 1}§m§r§c§7x§r §7${EntityToName(entityNew)}`;
                }
            }
        });
        new CustomEvents(this.name).Tick(40, () => {
            Object.keys(MinecraftDimensionTypes).forEach((dimid) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                allEntities.clear();
                world.getDimension(MinecraftDimensionTypes[dimid]).getEntities().filter(x => !resetEntities.has(x)).filter(x => MobStackList.some(b => b == x.typeId)).forEach(en => {
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
                    console.warn(removedAmount, currAmount);
                    entity.nameTag = `§e>> §m§r§c${removedAmount + currAmount}§m§r§c§7x§r §7${EntityToName(entity)}`;
                    allEntities.clear();
                    world.getDimension(MinecraftDimensionTypes[dimid]).getEntities().filter(x => !resetEntities.has(x)).filter(x => MobStackList.some(b => b == x.typeId)).forEach(en => {
                        allEntities.add(en);
                    });
                }
            }));
        });
    }
}
//# sourceMappingURL=index.js.map