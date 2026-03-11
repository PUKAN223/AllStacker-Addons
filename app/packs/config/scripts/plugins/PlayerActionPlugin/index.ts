import { IActionForm, PluginBase } from "@axeth/api";
import {
  Entity,
  EntityTypeFamilyComponent,
  Player,
  PlayerInteractWithEntityBeforeEvent,
} from "@minecraft/server";

class PlayerActionPlugin extends PluginBase {
  public override name: string = "PlayerActionPlugin";
  public override version: string = "1.0.0";

  private ignoreItems: string[] = [
    "kisu:handcuff",
  ];

  public override onLoad(): void {
    this.events.on("BeforePlayerInteractWithEntity", (ev) => {
      this.system.run(() => {
        this.handleInteractWithEntity(ev);
      });
    });
  }

  private isCar(en: Entity) {
    if (en.hasComponent(EntityTypeFamilyComponent.componentId)) {
      const family = en.getComponent(EntityTypeFamilyComponent.componentId);
      return family?.hasTypeFamily("vehicle") || family?.hasTypeFamily("car");
    }
    return false;
  }

  private handleInteractWithEntity(ev: PlayerInteractWithEntityBeforeEvent) {
    if (!ev.player.isSneaking) return;
    if (ev.target instanceof Entity && this.isCar(ev.target)) {
      ev.cancel = true;
      this.system.run(() => {
        //check is my car
        const vehicle = ev.target.getTags().find((x) =>
          x.startsWith("vehicle:")
        );
        if (!vehicle) return;
        const owner = vehicle.split(":")[1];
        if (owner !== ev.player.name) return;

        const carRemove = IActionForm.createForm(
          `§a§c§t§i§o§n§r§fเก็บรถ`,
        );
        carRemove.addLabel(`\nคุณต้องการเก็บรถคันนี้หรือไม่?`);
        carRemove.addButton("  §fเก็บ", "", () => {
          const carEntity = ev.target;
          const carData: Record<string, string | number | boolean> = {};
          const propertiesToSave = [
            "nitric_ve:in_workshop",
            "nitric_ve:car_color",
            "nitric_ve:car_wheel",
            "nitric_ve:car_decal_0",
            "nitric_ve:car_decal_1",
            "nitric_ve:car_front_body_kit",
            "nitric_ve:car_side_body_kit",
            "nitric_ve:car_back_body_kit",
            "nitric_ve:car_muffle",
            "nitric_ve:car_spoiler",
            "nitric_ve:door_active",
            "nitric_ve:unlock_car_color",
            "nitric_ve:unlock_car_decal_0",
            "nitric_ve:unlock_car_decal_1",
            "nitric_ve:speed",
          ];
          for (const key of propertiesToSave) {
            try {
              const val = carEntity.getProperty(key);
              if (val !== undefined) {
                carData[key] = val as string | number | boolean;
              }
            } catch {
              // property doesn't exist on this entity, skip
            }
          }
          if (Object.keys(carData).length > 0) {
            ev.player.setDynamicProperty(
              carEntity.typeId,
              JSON.stringify(carData),
            );
          }
          ev.player.removeTag("car_spawned_once");
          carEntity.remove();
          ev.player.playSound("random.orb");
        });
        carRemove.show(ev.player);
      });
    }
    if (ev.target instanceof Player === false) return;
    ev.cancel = true;
    const invComp = ev.player.getComponent("inventory")!;
    if (!invComp) return;
    const heldItem = invComp.container.getItem(ev.player.selectedSlotIndex);
    if (heldItem && this.ignoreItems.includes(heldItem.typeId)) return;

    const actionUi = IActionForm.createForm(
      `§a§c§t§i§o§n§r§fการกระทำ §e${ev.target.nameTag}`,
    );
    actionUi.addLabel(" §7เลือกการกระทำที่ต้องการทำกับผู้เล่น");
    actionUi.addButton("  §fอุ้ม", "", () => {
      this.events.emit("CustomPlayerCarryPlayer", {
        owner: ev.player,
        player: ev.target as Player,
        isDeathState: ev.target.hasTag("dead_player"),
      });
    });
    if (ev.player.hasTag("police")) {
      actionUi.addDivider();
      actionUi.addButton("  §cค้นตัวผู้เล่น", "", () => {
        this.events.emit("CustomPoliceSearchPlayer", {
          police: ev.player,
          player: ev.player,
        });
      });
    }
    actionUi.show(ev.player);
  }
}

export { PlayerActionPlugin };
