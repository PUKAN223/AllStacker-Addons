import {
  Entity,
  EntityEquippableComponent,
  EntityInventoryComponent,
  EntityScaleComponent,
  EquipmentSlot,
  ItemDurabilityComponent,
  ItemStack,
  Player,
  type Vector3,
  world,
} from "@minecraft/server";

import { IActionForm, IModalForm, PluginBase } from "@axeth/api";

import { PlayerUtils } from "../../../../../../../packages/api/src/global/Player.ts";

import { AnimalAreaManager } from "./AnimalAreaManager.ts";
import { AnimalDataManager } from "./AnimalDataManager.ts";

import type { AnimalArea } from "../types/AnimalArea.ts";
import type { AnimalData } from "../types/AnimalData.ts";
import type { SpawnEggRegistry } from "../types/SpawnEggRegistry.ts";

class AnimalFarmManager {
  private readonly plugin: PluginBase;
  private readonly spawnEggRegistry = new Map<string, SpawnEggRegistry>();
  private readonly animalDataManager: AnimalDataManager;
  private readonly animalAreaManager: AnimalAreaManager;

  private readonly animalHitDelayTicks = 10;
  private readonly animalLastHitTick = new Map<string, number>();

  private readonly maxAnimalsPerPlayer = 3;
  private readonly maxDistanceFromOwner = 12;

  private readonly butcherKnifeTypeId = "hams:ed_butcher_knife";

  private readonly listAnimalName = [
    "น้องพูล",
    "น้องเจ",
    "น้องสี่",
    "น้องฉลาม",
    "น้องจิ",
    "น้องลี่",
    "น้องพรีม",
    "น้องเนย",
    "น้องฮัน",
  ];

  private constructor(plugin: PluginBase) {
    this.plugin = plugin;
    this.animalDataManager = new AnimalDataManager(this.plugin);
    this.animalAreaManager = new AnimalAreaManager(this.plugin);
    this.handleEvent();
  }

  static initialize(plugin: PluginBase) {
    return new AnimalFarmManager(plugin);
  }

  public registerSpawnEgg(typeId: string, data: SpawnEggRegistry) {
    this.spawnEggRegistry.set(typeId, data);
  }

  public showAnimalArea(pl: Player) {
    const areaUI = IActionForm.createForm(
      `จัดการพื้นที่ฟาร์มสัตว์`,
      `นี่คือเมนูจัดการพื้นที่ฟาร์มสัตว์\nคุณสามารถเพิ่มหรือจัดการพื้นที่ฟาร์มสัตว์ได้ที่นี่`,
    );

    areaUI.addButton("ปิด", "textures/ui/realms_red_x");
    areaUI.addButton("เพิ่มพื้นที่", "textures/items/compass_item", () => {
      this.showAddAreaUi(pl);
    });
    areaUI.addDivider();

    for (const [id, area] of Object.entries(this.animalAreaManager.data)) {
      areaUI.addButton(id, "textures/items/compass_item", () => {
        this.showActionAreaUi(pl, { id, data: area });
      });
    }

    areaUI.show(pl);
  }

  private showActionAreaUi(
    pl: Player,
    data: { id: string; data: AnimalArea[string] },
  ) {
    const actionAreaUI = IActionForm.createForm(
      `§a§c§t§i§o§n§r§fจัดการพื้นที่ฟาร์มสัตว์`,
    );
    actionAreaUI.addLabel(
      `\nนี่คือเมนูจัดการพื้นที่ฟาร์มสัตว์`,
    );

    actionAreaUI.addButton("เเก้ไข", "textures/items/compass_item", () => {
      this.showAddAreaUi(pl, { id: data.id, data: data.data });
    });

    actionAreaUI.addButton("ลบพื้นที่", "textures/ui/realms_red_x", () => {
      this.animalAreaManager.removeArea(data.id);
      this.showAnimalArea(pl);
    });

    actionAreaUI.show(pl);
  }

  private showAddAreaUi(
    pl: Player,
    editData?: { id: string; data: AnimalArea[string] },
  ) {
    console.warn(JSON.stringify(editData?.data));
    const manageArea = IModalForm.createForm(
      editData ? `เเก้ไขพื้นที่ฟาร์มสัตว์` : `เพิ่มพื้นที่ฟาร์มสัตว์`,
      editData ? `แก้ไขพื้นที่ฟาร์มสัตว์` : `เพิ่มพื้นที่ฟาร์มสัตว์`,
    );

    const formData = {
      id: "",
      start: { x: 0, y: 0, z: 0 },
      end: { x: 0, y: 0, z: 0 },
    };

    manageArea.addTextField(
      {
        label: `ชื่อพื้นที่`,
        placeholderText: `ชื่อพื้นที่ฟาร์มสัตว์`,
        defaultValue: editData ? editData.id : "",
      },
      (value) => (formData.id = value),
    );

    manageArea.addTextField(
      {
        label: `พิกัดที่เริ่ม`,
        placeholderText: `พิกัดเริ่มต้นฟาร์มสัตว์`,
        defaultValue: editData
          ? Object.values(editData.data.start).map((x) => x).join(",")
          : "",
      },
      (value) => {
        const split = value.trim().split(",").map((x) => parseInt(x));
        formData.start = { x: split[0]!, y: split[1]!, z: split[2]! };
      },
    );

    manageArea.addTextField(
      {
        label: `พิกัดจบ`,
        placeholderText: `พิกัดเริ่มจบ`,
        defaultValue: editData
          ? Object.values(editData.data.end).map((x) => x).join(",")
          : "",
      },
      (value) => {
        const split = value.split(",").map((x) => parseInt(x));
        formData.end = { x: split[0]!, y: split[1]!, z: split[2]! };
      },
    );

    manageArea.show(pl).then((res) => {
      if (!res || res.canceled) return;

      if (editData) {
        this.animalAreaManager.editArea(formData.id, {
          start: formData.start,
          end: formData.end,
        });
      } else {
        this.animalAreaManager.addArea(formData.id, {
          start: formData.start,
          end: formData.end,
        });
      }
      this.showAnimalArea(pl);
      PlayerUtils.sendToast(pl, ``, `เพิ่มพื้นที่สัตว์สำเร็จ`);
    });
  }

  private handleEvent() {
    this.plugin.events.on("BeforePlayerInteractWithBlock", (ev) => {
      const it = ev.itemStack;
      if (!it) return;
      if (this.spawnEggRegistry.has(it.typeId)) ev.cancel = true;
    });

    this.plugin.events.on("AfterTick", (ev) => {
      if (ev.currentTick % 20 === 0) this.handleTick();
    });

    this.plugin.events.on("AfterItemUse", (ev) => {
      const it = ev.itemStack;
      if (!it) return;

      if (this.spawnEggRegistry.has(it.typeId)) {
        this.handleUseSpawnEgg(it, ev.source);
      }
    });

    this.plugin.events.on("AfterEntityHitEntity", (ev) => {
      try {
        const hit = ev.hitEntity;
        const anData = this.animalDataManager.getAnimal(hit.id);
        if (!anData) return;

        const nowTick = this.plugin.system.currentTick;
        const lastTick = this.animalLastHitTick.get(hit.id) ??
          (nowTick - this.animalHitDelayTicks);

        if (nowTick - lastTick < this.animalHitDelayTicks) return;
        this.animalLastHitTick.set(hit.id, nowTick);

        const attacker = ev.damagingEntity;
        if (!(attacker instanceof Player)) return;

        const holdItem = attacker
          .getComponent(EntityEquippableComponent.componentId)
          ?.getEquipment(EquipmentSlot.Mainhand);

        if (!holdItem || holdItem.typeId !== this.butcherKnifeTypeId) {
          PlayerUtils.sendToast(
            attacker,
            ``,
            `กรุณาใช้มีดเพื่อฆ่า`,
            `textures/items/tools/butcher_knife`,
          );
          return;
        }

        const timeRemain = anData.spawnTime - nowTick;
        if (timeRemain > 0) {
          PlayerUtils.sendToast(
            attacker,
            ``,
            `กรุณารอให้โตก่อน`,
            anData.info.icon,
          );
          return;
        }

        if (anData.ownerId !== attacker.id) {
          PlayerUtils.sendToast(attacker, ``, `นี่ไม่ใช่สัตว์ของคุณ`);
          return;
        }

        anData.health -= 2;
        this.consumeKnifeDurability(attacker);

        if (anData.health <= 0) {
          this.spawnLoot(hit, anData);
          this.animalDataManager.removeAnimal(hit.id);
          this.animalLastHitTick.delete(hit.id);
          hit.kill();
          return;
        }

        this.updateNameTag(hit, anData);
        hit.dimension.playSound("game.player.hurt", hit.location);
        this.animalDataManager.updateAnimalHealth(hit.id, anData.health);
      } catch (error) {
        console.warn(error);
      }
    });
  }

  private handleTick() {
    const animals = this.animalDataManager.getAnimals();
    const players = world.getAllPlayers();
    const nowTick = this.plugin.system.currentTick;

    for (const an of animals) {
      if (players.length <= 0) return;

      const owner = players.find((p) => p.id === an.ownerId);
      if (!owner) {
        this.removeAnimal(an);
        continue;
      }

      const entity = world.getEntity(an.animalId);
      if (!entity) {
        this.animalDataManager.removeAnimal(an.animalId);
        continue;
      }

      const distance = this.getDistance(entity.location, owner.location);
      if (distance > this.maxDistanceFromOwner) {
        this.removeAnimal(an);
        PlayerUtils.sendToast(
          owner,
          ``,
          `สัตว์ของคุณถูกลบ เนื่องจากอยู่ห่างจากสัตว์มากเกินไป`,
        );
        continue;
      }

      this.updateNameTag(entity, an);

      const timeRemain = an.spawnTime - nowTick;
      if (timeRemain <= 0) {
        if (timeRemain <= -1500) {
          this.removeAnimal(an);
        }

        const sc = entity.getComponent(EntityScaleComponent.componentId)?.value;
        if (sc !== undefined && sc <= 0.6) {
          entity.triggerEvent("hams:adult_spawn");
        }
      }
    }
  }

  private updateNameTag(animal: Entity, an: AnimalData) {
    const timeRemain = an.spawnTime - this.plugin.system.currentTick;

    const status = timeRemain > 0
      ? `§cกำลังโตในอีก §7${Math.floor(timeRemain / 20)}§c วินาที`
      : an.health === 20
      ? "§aโตแล้ว"
      : `(${an.health}/20)`;

    animal.nameTag = `§7[§e${an.ownerName}§7] §f${an.animalName}\n${status}`;
  }

  private removeAnimal(an: AnimalData) {
    this.animalLastHitTick.delete(an.animalId);
    this.animalDataManager.removeAnimal(an.animalId);
    world.getEntity(an.animalId)?.remove();
  }

  private getDistance(a: Vector3, b: Vector3) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private handleUseSpawnEgg(item: ItemStack, pl: Player) {
    if (!item || !pl) return;

    const ownedCount = this.animalDataManager.getAnimals().reduce(
      (acc, an) => acc + (an.ownerId === pl.id ? 1 : 0),
      0,
    );

    if (ownedCount >= this.maxAnimalsPerPlayer) {
      PlayerUtils.sendToast(pl, ``, `คุณมีสัตว์มากเกินไป`);
      return;
    }

    const reg = this.spawnEggRegistry.get(item.typeId);
    if (!reg) return;

    if (!this.animalAreaManager.isInAnimalArea(pl.location)) {
      PlayerUtils.sendToast(pl, ``, `กรุณาใช้งานในพื้นที่ฟาร์มสัตว์`, reg.icon);
      return;
    }

    this.reduceItem(item, pl);

    const animal = pl.dimension.spawnEntity(reg.animalType, pl.location);
    animal.triggerEvent("hams:baby_spawn");

    const animalName = this
      .listAnimalName[Math.floor(Math.random() * this.listAnimalName.length)]!;

    try {
      this.animalDataManager.addAnimal({
        animalId: animal.id,
        animalType: animal.typeId,
        animalName,
        spawnTime: this.plugin.system.currentTick + reg.grownTime,
        ownerName: pl.name,
        ownerId: pl.id,
        info: reg,
        health: 20,
      });
    } catch (e) {
      console.error("Error adding animal:", e);
    }

    PlayerUtils.sendToast(
      pl,
      ``,
      `§fสปาว §e${animalName} §fสำเร็จ\nรอ §f${
        Math.floor(reg.grownTime / 20)
      }§f วินาที เพื่อเก็บผลผลิต`,
      reg.icon,
    );

    animal.nameTag = `[${pl.name}] ${animalName}`;
    animal.addEffect("instant_health", 19999999, {
      amplifier: 255,
      showParticles: false,
    });
  }

  private spawnLoot(entity: Entity, anData: AnimalData) {
    const drops = anData?.info.drop ?? [];
    const pos = entity.location;

    for (const drop of drops) {
      const [minAmount, maxAmount] = drop.amount;
      const roll = Math.random() * (maxAmount - minAmount) + minAmount;

      const item = new ItemStack(drop.type, Math.floor(roll));
      const dropItem = entity.dimension.spawnItem(item, pos);

      dropItem.applyImpulse({
        x: Math.random() * 0.2 - 0.1,
        y: Math.random() * 0.2,
        z: Math.random() * 0.2 - 0.1,
      });
    }
  }

  private consumeKnifeDurability(pl: Player) {
    const inv = pl.getComponent(EntityInventoryComponent.componentId)
      ?.container;
    if (!inv) return;

    const holdSlot = inv.getSlot(pl.selectedSlotIndex);
    const holdItem = holdSlot.getItem();
    if (!holdItem) return;

    const durability = holdItem.getComponent(
      ItemDurabilityComponent.componentId,
    );
    if (!durability) return;

    if (durability.damage + 1 >= durability.maxDurability) {
      holdSlot.setItem(undefined);
      pl.playSound("random.break", { volume: 1, pitch: 1 });
      return;
    }

    durability.damage += 1;
    holdSlot.setItem(holdItem);
  }

  private reduceItem(item: ItemStack, pl: Player) {
    const nextAmount = Math.max(0, item.amount - 1);
    const idx = pl.selectedSlotIndex;
    const inv = pl.getComponent(EntityInventoryComponent.componentId)
      ?.container;
    if (!inv) return;

    if (nextAmount <= 0) inv.setItem(idx, undefined);
    else inv.setItem(idx, new ItemStack(item.typeId, nextAmount));
  }
}

export { AnimalFarmManager };
