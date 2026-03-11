import { PlayerUtils, PluginBase, PluginSettingOptions } from "@axeth/api";
import { PhoneManager } from "./class/PhoneManager.ts";
import { GpsApp } from "./apps/GpsApp.ts";
import { BankApp } from "./apps/BankApp.ts";
import { EmoteApp } from "./apps/EmoteApp.ts";
import { GovernmentApp } from "./apps/GovernmentApp.ts";
import { Player, Vector3 } from "@minecraft/server";
import { InfoApp } from "./apps/InfoApp.ts";
import { ScaleApp } from "./apps/ScaleApp.ts";

class PhonePlugin extends PluginBase {
  public override name: string = "PhonePlugin";
  public override version: string = "1.0.0";

  private phoneManager: PhoneManager = PhoneManager.initialize(this);
  private appRegistry = [
    GpsApp,
    BankApp,
    GovernmentApp,
    EmoteApp,
    ScaleApp,
    InfoApp,
  ];

  public override onLoad(): void {
    for (const app of this.appRegistry) {
      this.phoneManager.registerApp(app);
    } //

    this.events.on("AfterTick", ({ currentTick }) => {
      if (currentTick % 2 === 0) {
        const pl = this.world.getAllPlayers().filter((x) =>
          x.getTags().some((t) => t.startsWith("direction:"))
        );

        for (const p of pl) {
          const tags = p.getTags();
          const direction = tags.find((x) => x.startsWith("direction:"))!;
          const directionName = direction.split(":")[1];
          const directionLocation = direction.split(":")[2].split(",").map(
            Number,
          );
          const distance = Math.round(
            this.getDistance(p.location, {
              x: directionLocation[0],
              y: directionLocation[1],
              z: directionLocation[2],
            }),
          );

          if (distance <= 40) {
            PlayerUtils.sendToast(p, ``, `§fนำทาง§e ${directionName} §7สำเร็จ`);
            p.removeTag(direction);
            PlayerUtils.stopTopbar(p);
            continue;
          }

          PlayerUtils.sendTopbar(
            p,
            `กำลังนำทางไป §e${directionName}§r ${
              this.getDirection({
                x: directionLocation[0],
                y: directionLocation[1],
                z: directionLocation[2],
              }, p)
            }\n §7${directionLocation[0]} ${directionLocation[1]} ${
              directionLocation[2]
            } (${distance} blocks)`,
          );
        }
      }
    });
  }
  private getDirection(target: Vector3, player: Player) {
    const pos = player.location;
    const yaw = player.getRotation().y;
    const adjustedYaw = (yaw + 90 + 360) % 360;
    const angle = Math.atan2(target.z - pos.z, target.x - pos.x) *
      (180 / Math.PI);
    const diff = (angle - adjustedYaw + 360) % 360;
    return diff < 22.5 || diff > 337.5
      ? ""
      : diff < 67.5
      ? ""
      : diff < 112.5
      ? ""
      : diff < 157.5
      ? ""
      : diff < 202.5
      ? ""
      : diff < 247.5
      ? ""
      : diff < 292.5
      ? ""
      : "";
  }
  private getDistance(loc1: Vector3, loc2: Vector3) {
    const dx = loc1.x - loc2.x;
    const dy = loc1.y - loc2.y;
    const dz = loc1.z - loc2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  public override getSettings(): PluginSettingOptions {
    return {
      "bankBill": {
        canUserModify: false,
        default: "{}",
        description: "",
        type: "string",
      },
    };
  }
}

export { PhonePlugin };
