import { IActionForm, PlayerUtils, PluginBase } from "@axeth/api";
import { Entity, Player, type Vector3 } from "@minecraft/server";
import { CarTypeDataManager } from "./CarTypeDataManager.ts";
import type { CarTypeData, CarTypeGroup } from "../types/CarSpawnData.ts";
import { VehicleDataManager } from "./VehicleDataManager.ts";

class CarSpawnManagers {
  private readonly plugin: PluginBase;
  private readonly carTypeDataManager: CarTypeDataManager;
  private readonly spawnedBeforeTag = "car_spawned_once";

  private vehicleDataManager!: VehicleDataManager;

  private constructor(
    plugin: PluginBase,
    carTypeDataManager: CarTypeDataManager,
  ) {
    this.plugin = plugin;
    this.carTypeDataManager = carTypeDataManager;
    this.vehicleDataManager = new VehicleDataManager(plugin);
  }

  public static initialize(
    plugin: PluginBase,
    carTypeDataManager: CarTypeDataManager,
  ) {
    return new CarSpawnManagers(plugin, carTypeDataManager);
  }

  public isNpcCarSpawn(entity: Entity): boolean {
    return entity.getTags().some((tag) =>
      tag === "car_spawn" || tag.startsWith("car_spawn:")
    );
  }

  private getSpawnKeyFromEntity(entity: Entity): string {
    const spawnTag = entity.getTags().find((tag) =>
      tag.startsWith("car_spawn:")
    );
    if (!spawnTag) return "default";

    const key = spawnTag.slice("car_spawn:".length).trim();
    return key.length > 0 ? key : "default";
  }

  private getRespawnFee(): number {
    const rawValue = this.plugin.config.get()["carRespawnFee"]?.value;
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.floor(parsed);
  }

  private getRespawnFeeScoreName(): string {
    const rawValue = this.plugin.config.get()["carRespawnFeeScore"]?.value;
    const name = `${rawValue ?? "money"}`.trim();
    return name.length > 0 ? name : "money";
  }

  private getPlayerScore(player: Player, objectiveId: string): number {
    const scoreboard = this.plugin.world.scoreboard;
    const objective = scoreboard.getObjective(objectiveId);
    if (!objective) return 0;
    if (!objective.hasParticipant(player)) return 0;
    return objective.getScore(player) ?? 0;
  }

  private tryTakePlayerScore(
    player: Player,
    objectiveId: string,
    amount: number,
  ): boolean {
    const scoreboard = this.plugin.world.scoreboard;
    const objective = scoreboard.getObjective(objectiveId);
    if (!objective) return false;

    const current = objective.hasParticipant(player)
      ? objective.getScore(player) ?? 0
      : 0;

    if (current < amount) return false;
    objective.setScore(player, current - amount);
    return true;
  }

  public openCarSpawnMenu(player: Player, npc: Entity): void {
    const spawnKey = this.getSpawnKeyFromEntity(npc);
    this.openCarModelMenu(player, spawnKey);
  }

  private openCarModelMenu(player: Player, spawnKey: string): void {
    const groups = this.carTypeDataManager.getPlayerCarGroupsBySpawnKey(
      player,
      spawnKey,
    );

    if (groups.length <= 0) {
      PlayerUtils.sendToast(
        player,
        "",
        this.plugin.mcColors("คุณยังไม่มีรถที่สามารถเรียกได้ในจุดนี้").red,
      );
      return;
    }

    const menu = IActionForm.createForm(
      `เมนูเรียกรถ (${spawnKey})`,
      ``,
    );
    menu.addButton(this.plugin.mcColors("ปิด").red, "textures/ui/realms_red_x");
    menu.addDivider();

    for (const group of groups) {
      const vehicleData = this.vehicleDataManager.getVehicle(
        `vehicle:${player.name}:${group.variants[0].typeId}`,
      );
      menu.addButton(
        this.plugin.mcColors(group.modelName).white +
          this.plugin.mcColors(
            ` [§7น้ำมัน§r ${vehicleData?.fuel.toFixed(0) ?? 0} |  §c${
              (vehicleData?.maxBroken ?? 0) - (vehicleData?.broken ?? 0)
            }/${vehicleData?.maxBroken ?? 0}§r]`,
          ).white,
        group.icon,
        () => {
          if (group.variants.length === 1) {
            void this.handleSpawnRequest(player, group.variants[0]!);
            return;
          }

          this.openCarColorMenu(player, spawnKey, group);
        },
      );
    }

    menu.show(player);
  }

  private openCarColorMenu(
    player: Player,
    spawnKey: string,
    group: CarTypeGroup,
  ): void {
    const menu = IActionForm.createForm(
      `เลือกรถสี (${group.modelName})`,
    );

    menu.addButton(
      this.plugin.mcColors("ย้อนกลับ").yellow,
      "textures/ui/arrow_left",
      () => {
        this.openCarModelMenu(player, spawnKey);
      },
    );
    menu.addDivider();

    for (const variant of group.variants) {
      const colorName = variant.colorName ?? variant.name;
      menu.addButton(
        this.plugin.mcColors(colorName).white,
        variant.icon,
        () => {
          void this.handleSpawnRequest(player, variant);
        },
      );
    }

    menu.show(player);
  }

  private async handleSpawnRequest(
    player: Player,
    car: CarTypeData,
  ): Promise<void> {
    const isSpawnedBefore = player.hasTag(this.spawnedBeforeTag);

    if (!isSpawnedBefore) {
      const spawned = this.spawnCarForPlayer(
        player,
        car.typeId,
        car.name,
        car.icon,
      );
      if (spawned) player.addTag(this.spawnedBeforeTag);
      return;
    }

    const fee = this.getRespawnFee();
    if (fee <= 0) {
      this.spawnCarForPlayer(player, car.typeId, car.name, car.icon);
      return;
    }

    const scoreName = this.getRespawnFeeScoreName();
    const confirmForm = IActionForm.createForm(
      "§a§c§t§i§o§n§r§fยืนยันการเรียกรถ",
      ``,
    )
      .addLabel(
        `คุณเคยเรียกรถไปแล้ว\nการเรียกรถครั้งนี้ต้องจ่าย ${fee.toLocaleString()}`,
      )
      .addButton("   ยกเลิก")
      .addButton("   จ่ายเงินและเรียกรถ");

    const response = await confirmForm.show(player);
    if (response.canceled || response.selection !== 1) return;

    const paid = this.tryTakePlayerScore(player, scoreName, fee);
    if (!paid) {
      PlayerUtils.sendToast(
        player,
        "",
        this.plugin.mcColors(`เงินไม่พอ`).red,
      );
      return;
    }

    const spawned = this.spawnCarForPlayer(
      player,
      car.typeId,
      car.name,
      car.icon,
    );
    if (!spawned) {
      // Refund if spawn fails after payment.
      const scoreboard = this.plugin.world.scoreboard;
      const objective = scoreboard.getObjective(scoreName);
      if (objective) {
        const current = objective.hasParticipant(player)
          ? objective.getScore(player) ?? 0
          : 0;
        objective.setScore(player, current + fee);
      }
      return;
    }

    PlayerUtils.sendToast(
      player,
      "",
      this.plugin.mcColors(`หักเงิน ${fee.toLocaleString()} จาก ${scoreName} แล้ว`)
        .yellow,
    );
  }

  private spawnCarForPlayer(
    player: Player,
    typeId: string,
    carName: string,
    carIcon: string,
  ): boolean {
    const spawnLocation = this.getForwardLocation(
      player.location,
      player.getViewDirection(),
      2.5,
    );

    try {
      const entity = player.dimension.spawnEntity(typeId, spawnLocation);
      entity.addTag(`vehicle:${player.name}:${entity.typeId}`);

      const savedData = player.getDynamicProperty(entity.typeId);
      if (typeof savedData === "string" && savedData.length > 0) {
        try {
          const carData = JSON.parse(savedData) as Record<
            string,
            string | number | boolean
          >;
          for (const key in carData) {
            try {
              entity.setProperty(key, carData[key]!);
            } catch {
              // property doesn't exist on this entity variant, skip
            }
          }
        } catch {
          // malformed JSON, ignore
        }
      }

      PlayerUtils.sendToast(
        player,
        "",
        this.plugin.mcColors(`เรียกรถ ${carName} สำเร็จ`).green,
        carIcon,
      );
      return true;
    } catch {
      PlayerUtils.sendToast(
        player,
        "",
        this.plugin.mcColors(`ไม่สามารถเรียกรถ ${carName} ได้`).red,
      );
      return false;
    }
  }

  private getForwardLocation(
    position: Vector3,
    direction: Vector3,
    distance: number,
  ): Vector3 {
    return {
      x: position.x + direction.x * distance,
      y: position.y,
      z: position.z + direction.z * distance,
    };
  }
}

export { CarSpawnManagers };
