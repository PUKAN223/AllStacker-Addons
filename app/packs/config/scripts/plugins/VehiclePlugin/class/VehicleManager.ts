import { PlayerUtils, PluginBase } from "@axeth/api";
import {
  Entity,
  EntityEquippableComponent,
  EntityRidingComponent,
  EntityTypeFamilyComponent,
  EquipmentSlot,
  HudElement,
  HudVisibility,
  Player,
  PlayerInteractWithEntityBeforeEvent,
  system,
} from "@minecraft/server";
import type { VehicleData } from "../types/VehicleData.ts";
import { VehicleDataManager } from "./VehicleDataManager.ts";

class VehicleManager {
  private plugin: PluginBase;

  private vehicleDataManager: VehicleDataManager;

  private playerIsRiding = new Map<string, string>(); // playerId -> vehicleId
  private vehicleEntities = new Map<string, Entity>(); // vehicleId -> Entity
  private playerVehicleData = new Map<string, {
    vehicle: Entity;
    vehicleData: VehicleData;
    rider: Player;
    lastSyncDB: number;
  }>();

  private constructor(plugin: PluginBase) {
    this.plugin = plugin;
    this.vehicleDataManager = new VehicleDataManager(this.plugin);

    this.plugin.events.on<"CustomPlayerStopRiding", {
      player: Player;
      vehicle: Entity;
    }>("CustomPlayerStopRiding", ({ player, vehicle }) => {
      this.handleStopRideVehicle(player, vehicle);
    });

    this.plugin.events.on<"CustomPlayerStartRiding", {
      player: Player;
      vehicle: Entity;
    }>("CustomPlayerStartRiding", ({ player, vehicle }) => {
      this.handleStartRideVehicle(player, vehicle);
    });

    this.plugin.events.on("AfterEntityHurt", (ev) => {
      const vehicle = ev.hurtEntity;
      const vehicleId = this.vehicleDataManager.getVehicleId(vehicle);
      if (!vehicleId) return;

      this.handleVehicleHurt(vehicle, 15);
    });

    this.plugin.events.on("BeforePlayerInteractWithEntity", (ev) => {
      this.handleToolsUse(ev);
    });

    this.handleTick();
  }

  static initialize(plugin: PluginBase): VehicleManager {
    return new VehicleManager(plugin);
  }

  public handleToolsUse(ev: PlayerInteractWithEntityBeforeEvent) {
    if (!ev.itemStack) return;
    const pl = ev.player;
    const vehicle = ev.target;
    const vehicleId = this.vehicleDataManager.getVehicleId(vehicle);
    if (!vehicleId) return;

    const vehicleData = this.vehicleDataManager.getVehicle(vehicleId);
    if (!vehicleData) return;

    if (ev.itemStack.typeId === "kisu:repair_tools") {
      ev.cancel = true;
      system.run(() => {
        vehicleData.broken = 0;
        const vehicleId = this.vehicleDataManager.getVehicleId(vehicle);
        if (!vehicleId) return;
        const playerVehicleData = this.playerVehicleData.get(vehicleId);
        if (playerVehicleData) {
          this.playerVehicleData.set(vehicleId, {
            ...playerVehicleData,
            vehicleData,
          });
        } else {
          this.vehicleDataManager.editVehicle(vehicleId, vehicleData);
        }
        PlayerUtils.sendToast(
          pl,
          ``,
          `รถของคุณได้รับการซ่อมแซม`,
          "textures/items/tools/repair_tools",
        );
        pl.getComponent(EntityEquippableComponent.componentId)?.setEquipment(
          EquipmentSlot.Mainhand,
          undefined,
        );
      });
    } else if (ev.itemStack.typeId === "kisu:gas") {
      ev.cancel = true;
      system.run(() => {
        vehicleData.fuel = vehicleData.maxFuel;
        const vehicleId = this.vehicleDataManager.getVehicleId(vehicle);
        if (!vehicleId) return;
        const playerVehicleData = this.playerVehicleData.get(vehicleId);
        if (playerVehicleData) {
          this.playerVehicleData.set(vehicleId, {
            ...playerVehicleData,
            vehicleData,
          });
        } else {
          this.vehicleDataManager.editVehicle(vehicleId, vehicleData);
        }
        PlayerUtils.sendToast(
          pl,
          ``,
          `รถของคุณได้รับการเติมน้ำมันเเล้ว`,
          "textures/items/tools/gas",
        );
        pl.getComponent(EntityEquippableComponent.componentId)?.setEquipment(
          EquipmentSlot.Mainhand,
          undefined,
        );
      });
    }
  }

  public handleVehicleHurt(vehicle: Entity, damage: number) {
    const vehicleId = this.vehicleDataManager.getVehicleId(vehicle);
    if (!vehicleId) return;

    const vehicleData = this.vehicleDataManager.getVehicle(vehicleId);
    if (!vehicleData) return;
    const playerVehicleData = this.playerVehicleData.get(vehicleId);

    vehicleData.broken += damage;

    if (playerVehicleData) {
      this.playerVehicleData.set(vehicleId, {
        ...playerVehicleData,
        vehicleData,
      });
    } else {
      this.vehicleDataManager.updateVehicle(vehicleId, vehicleData);
    }
    vehicle.dimension.playSound("random.break", vehicle.location);
  }

  public handleStartRideVehicle(pl: Player, vehicle: Entity): void {
    const vehicleId = this.vehicleDataManager.getVehicleId(vehicle);
    if (!vehicleId) return;

    // Store entity reference
    this.vehicleEntities.set(vehicleId, vehicle);

    const vehicleData = this.vehicleDataManager.getVehicle(vehicleId);

    this.playerVehicleData.set(vehicleId, {
      vehicle,
      vehicleData: vehicleData ?? {
        broken: 0,
        maxBroken: 100,
        maxFuel: 100,
        fuel: 100,
      },
      rider: pl,
      lastSyncDB: this.plugin.system.currentTick,
    });

    if (vehicleData) {
      this.vehicleDataManager.editVehicle(vehicleId, vehicleData);

      if (vehicleData.broken >= vehicleData.maxBroken) {
        PlayerUtils.sendToast(
          pl,
          ``,
          `รถของคุณเสีย กรุณาใช้กล่องซ่อม`,
          "textures/items/tools/repair_tools",
        );
      }
      if (vehicleData.fuel <= 0) {
        PlayerUtils.sendToast(
          pl,
          ``,
          `รถของคุณหมดน้ำมัน กรุณาเติมน้ำมัน`,
          "textures/items/tools/gas",
        );
      }
    } else {
      this.vehicleDataManager.addVehicle(vehicleId, {
        broken: 0,
        maxBroken: 100,
        maxFuel: 100,
        fuel: 100,
      });
    }
  }

  public handleStopRideVehicle(pl: Player, vehicle: Entity): void {
    if (!pl || !vehicle) return;

    const vehicleId = this.vehicleDataManager.getVehicleId(vehicle);
    if (!vehicleId) {
      return;
    }

    const currentData = this.playerVehicleData.get(vehicleId);
    if (!currentData) {
      this.playerIsRiding.delete(pl.id);
      return;
    }

    this.vehicleDataManager.editVehicle(vehicleId, currentData.vehicleData);

    // Teleport player to vehicle location to prevent falling through world
    try {
      pl.teleport({
        x: vehicle.location.x,
        y: vehicle.location.y,
        z: vehicle.location.z,
      });
      PlayerUtils.sendUi(pl, `§m§k§a§r`);
      pl.onScreenDisplay.setHudVisibility(HudVisibility.Reset, [
        HudElement.Armor,
        HudElement.AirBubbles,
        HudElement.HorseHealth,
      ]);
      PlayerUtils.stopBottomBar(pl);
    } catch (error) {
      console.warn("Failed to teleport player:", error);
    }

    // Clean up tracking data
    this.playerVehicleData.delete(vehicleId);
    this.playerIsRiding.delete(pl.id);
    this.vehicleEntities.delete(vehicleId);
  }

  public handleTick() {
    this.plugin.events.on("AfterTick", ({ currentTick }) => {
      if (currentTick % 10 !== 0) return;
      this.handleVehicleTicking();

      // Check for players who stopped riding
      this.playerIsRiding.forEach((vehicleId, playerId) => {
        const pl = this.plugin.world.getAllPlayers().find((x) =>
          x.id === playerId
        );
        if (!pl) {
          this.playerIsRiding.delete(playerId);
          this.playerVehicleData.delete(vehicleId);
          this.vehicleEntities.delete(vehicleId);
          return;
        }

        const rideComp = pl.getComponent(EntityRidingComponent.componentId);
        if (!rideComp || !rideComp.entityRidingOn) {
          const vehicle = this.vehicleEntities.get(vehicleId);
          if (vehicle) {
            this.plugin.events.emit("CustomPlayerStopRiding", {
              player: pl,
              vehicle: vehicle,
            });
          }
          this.playerIsRiding.delete(playerId);
          return;
        }

        // Verify they're still riding the same vehicle
        const currentVehicle = rideComp.entityRidingOn;
        if (!currentVehicle) {
          const oldVehicle = this.vehicleEntities.get(vehicleId);
          if (oldVehicle) {
            this.plugin.events.emit("CustomPlayerStopRiding", {
              player: pl,
              vehicle: oldVehicle,
            });
          }
          this.playerIsRiding.delete(playerId);
          return;
        }

        const currentVehicleId = this.vehicleDataManager.getVehicleId(
          currentVehicle,
        );
        if (currentVehicleId !== vehicleId) {
          // Player switched vehicles or stopped riding this one
          const oldVehicle = this.vehicleEntities.get(vehicleId);
          if (oldVehicle) {
            this.plugin.events.emit("CustomPlayerStopRiding", {
              player: pl,
              vehicle: oldVehicle,
            });
          }
          this.playerIsRiding.delete(playerId);
        }
      });

      // Check for players who started riding
      for (const pl of this.plugin.world.getAllPlayers()) {
        const rideComp = pl.getComponent(EntityRidingComponent.componentId);
        if (!rideComp || !rideComp.entityRidingOn) continue;

        const vehicle = rideComp.entityRidingOn;
        if (!vehicle) continue;

        if (!vehicle.hasComponent(EntityTypeFamilyComponent.componentId)) {
          continue;
        }

        // const typeFamilyComp = vehicle.getComponent(
        //   EntityTypeFamilyComponent.componentId,
        // );
        if (vehicle.typeId == "kisu:bicycle") {
          continue;
        }
        // if (
        //   !typeFamilyComp || !typeFamilyComp.hasTypeFamily("vehicle") ||
        //   !typeFamilyComp.hasTypeFamily("car") ||
        //   vehicle.typeId == "kisu:bicycle"
        // ) {
        //   continue;
        // }
        // if (
        //   !typeFamilyComp || !typeFamilyComp.hasTypeFamily("vehicle") ||
        //   !typeFamilyComp.hasTypeFamily("car") ||
        //   vehicle.typeId == "kisu:bicycle"
        // ) {
        //   continue;
        // }

        const vehicleId = this.vehicleDataManager.getVehicleId(vehicle);
        if (!vehicleId) continue;

        // Only emit event if player wasn't already riding this vehicle
        const currentRidingVehicleId = this.playerIsRiding.get(pl.id);
        if (currentRidingVehicleId !== vehicleId) {
          this.playerIsRiding.set(pl.id, vehicleId);
          this.vehicleEntities.set(vehicleId, vehicle);
          this.plugin.events.emit("CustomPlayerStartRiding", {
            player: pl,
            vehicle: vehicle,
          });
        }
      }
    });
  }

  private handleVehicleTicking() {
    for (
      const [vehicleId, vehicle] of this
        .playerVehicleData
    ) {
      if (!vehicle) return;
      const vehicleEntity = vehicle.rider.dimension.getEntities({
        tags: [vehicleId],
      })[0];

      if (!vehicleEntity) return;

      const fuelAdjust = this.isCanAdjustFuel(vehicleEntity);
      if (fuelAdjust !== 0) {
        vehicle.vehicleData.fuel = Math.max(
          0,
          vehicle.vehicleData.fuel - fuelAdjust,
        );
      }
      this.playerVehicleData.set(vehicleId, vehicle);
      vehicleEntity.addEffect("instant_health", 1999999, {
        amplifier: 255,
        showParticles: false,
      });
      vehicleEntity.addEffect("resistance", 1999999, {
        amplifier: 255,
        showParticles: false,
      });

      this.giveSlowed(
        vehicleEntity,
        vehicle.vehicleData.broken,
        vehicle.vehicleData.fuel,
      );
      this.showVehicleStatus(vehicle.vehicleData, vehicle.rider, vehicleEntity);

      if (vehicle.lastSyncDB + 50 < this.plugin.system.currentTick) {
        vehicle.lastSyncDB = this.plugin.system.currentTick;
        this.vehicleDataManager.editVehicle(vehicleId, vehicle.vehicleData);
      }
    }
  }

  private isCanAdjustFuel(vehicle: Entity) {
    const velocity = vehicle.getVelocity();
    const sum = (Math.abs(velocity.x) + Math.abs(velocity.z)) / 2;

    if (sum >= 1) {
      return 0.1;
    } else if (sum != 0) {
      return 0.05;
    } else {
      return 0;
    }
  }

  private giveSlowed(vehicle: Entity, broken: number, fuel: number) {
    if (broken >= 100 || fuel <= 0) {
      vehicle.addEffect("slowness", 1999999, {
        amplifier: 225,
        showParticles: false,
      });
    } else if (broken >= 80) {
      vehicle.addEffect("slowness", 1999999, {
        amplifier: 3,
        showParticles: false,
      });
    } else if (broken >= 60) {
      vehicle.addEffect("slowness", 1999999, {
        amplifier: 2,
        showParticles: false,
      });
    } else if (broken >= 40) {
      vehicle.addEffect("slowness", 1999999, {
        amplifier: 1,
        showParticles: false,
      });
    } else if (broken >= 20) {
      vehicle.addEffect("slowness", 1999999, {
        amplifier: 0,
        showParticles: false,
      });
    } else {
      vehicle.removeEffect("slowness");
    }
  }

  private showVehicleStatus(
    vehicleData: VehicleData,
    pl: Player,
    vehicleEntity: Entity,
  ) {
    const velocity = vehicleEntity.getVelocity();
    const horizontalSpeed = Math.sqrt(
      velocity.x * velocity.x + velocity.z * velocity.z,
    );
    const speed = horizontalSpeed * 40;

    pl.onScreenDisplay.setHudVisibility(HudVisibility.Hide, [
      HudElement.Armor,
      HudElement.AirBubbles,
      HudElement.HorseHealth,
    ]);

    this.plugin.system.run(() => {
      if (speed !== 0) {
        pl.onScreenDisplay.setActionBar(
          `${Math.round(speed)} km/h`,
        );
      } else {
        pl.onScreenDisplay.setActionBar(``);
      }
    });
    const statusText = this.adjustTextLength(
      `§m§k§a§r`,
      100,
    );

    //1-100
    const fuelPercent = this.adjustTextLength(
      `${
        Math.max(
          Math.round(
            (vehicleData.fuel / vehicleData.maxFuel) * 100,
          ),
          1,
        )
      }`,
      10,
    );
    const brokenPercent = this.adjustTextLength(
      `${
        Math.max(
          Math.round(
            ((vehicleData.maxBroken - vehicleData.broken) /
              vehicleData.maxBroken) * 100,
          ),
          1,
        )
      }`,
      10,
    );

    PlayerUtils.sendUi(pl, `${statusText}${fuelPercent}${brokenPercent}`);
  }

  private adjustTextLength(text = "", totalLength = 100) {
    return (text.slice(0, totalLength)).padEnd(totalLength, "\t");
  }
}

export { VehicleManager };
