import { Entity, EntityColorComponent, EntityDamageCause, EntityIsBabyComponent, system, world } from "@minecraft/server";
import Plugins from "../../Class/Plugins";
import CustomEvents from "../../Events/CustomEvent";
import getEntitiesNearBy from "./Functions/GetEntitiesNearBy";
import EntityToName from "./Functions/EntityToName";
import spawnEntityClone from "./Functions/SpawnEntityClone";
import { UnStackMob } from "../ItemStacker/Configs/Database";

const allEntities = new Set<Entity>()
export const resetEntities = new Set<Entity>()

export default class MobStacker extends Plugins {
  private name: string
  constructor(name: string) {
    super(name)
    this.name = name;
  }

  public setup(): void {

  }

  public init(): void {
    new CustomEvents(this.name).EntityInteract((ev) => {
      if (ev.target.nameTag && ev.target.nameTag.includes("§m§r§c")) {
        const currAmount = ((ev.target.nameTag ?? "").includes("§m§r§c") ? parseInt(ev.target.nameTag.split("§m§r§c")[1]) : 1)
        system.run(() => {
          const entityNew = spawnEntityClone(ev.target)
          ev.target.nameTag = ``
          system.runTimeout(() => {
            if (!ev.target.isValid) return
            resetEntities.delete(ev.target)
          }, 300)
          resetEntities.add(ev.target)
          if (currAmount - 1 <= 0) return
          entityNew.nameTag = `§e>> §m§r§c${currAmount - 1}§m§r§c§7x§r §7${EntityToName(entityNew)}`
        })
      }
    })

    new CustomEvents(this.name).EntityDie((ev) => {
      if (ev.damageSource.cause == EntityDamageCause.none || ev.damageSource.cause == EntityDamageCause.selfDestruct) return;
      if (ev.deadEntity.nameTag && ev.deadEntity.nameTag.includes("§m§r§c")) {
        const currAmount = ((ev.deadEntity.nameTag ?? "").includes("§m§r§c") ? parseInt(ev.deadEntity.nameTag.split("§m§r§c")[1]) : 1)
        if (currAmount - 1 <= 0) {
          return;
        } else {
          const entityNew = spawnEntityClone(ev.deadEntity)
          entityNew.nameTag = `§e>> §m§r§c${currAmount - 1}§m§r§c§7x§r §7${EntityToName(entityNew)}`
        }
      }
    })

    new CustomEvents(this.name).Tick(40, () => {
      ["overworld", "nether", "the_end"].forEach(async (dimid) => {
        allEntities.clear()
        world.getDimension(dimid).getEntities().filter(x => !resetEntities.has(x)).filter(x => [...UnStackMob.keys()].some(b => b == x.typeId)).forEach(en => {
          allEntities.add(en)
        })
        for (const entity of allEntities) {
          let removedAmount = 0;
          const nearEntities = getEntitiesNearBy(entity.dimension, entity, 10);
          if (!nearEntities || nearEntities.length === 0) {
            continue;
          }
          for (const target of nearEntities) {
            const amount = ((target.nameTag ?? "").includes("§m§r§c") ? parseInt(target.nameTag.split("§m§r§c")[1]) : 1)
            target.dimension.spawnParticle("minecraft:large_explosion", { ...target.location, y: target.location.y + 0.5 })
            target.remove();
            removedAmount += amount
          }
          const currAmount = ((entity.nameTag ?? "").includes("§m§r§c") ? parseInt(entity.nameTag.split("§m§r§c")[1]) : 1)
          entity.nameTag = `§e>> §m§r§c${removedAmount + currAmount}§m§r§c§7x§r §7${EntityToName(entity)}`
          allEntities.clear()
          world.getDimension(dimid).getEntities().filter(x => !resetEntities.has(x)).filter(x => [...UnStackMob.keys()].some(b => b == x.typeId)).forEach(en => {
            allEntities.add(en)
          })
        }
      })
    })
  }
}
