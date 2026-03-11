import { PlayerUtils, PluginBase } from "@axeth/api";
import {
  EntityRideableComponent,
  InputPermissionCategory,
  Player,
} from "@minecraft/server";
import { PoliceArrestDataManager } from "./PoliceArrestDataManager.ts";

class PoliceArrestManager {
  private plugin: PluginBase;

  private policeArrestDataManager;

  private constructor(plugin: PluginBase) {
    this.plugin = plugin;

    this.policeArrestDataManager = PoliceArrestDataManager.initialize(
      this.plugin,
    );
  }

  static initialize(plugin: PluginBase): PoliceArrestManager {
    return new PoliceArrestManager(plugin);
  }

  public async handleArrest(pl: Player): Promise<void> {
    const robberRay = pl.getEntitiesFromViewDirection({
      maxDistance: 3,
      type: "minecraft:player",
    })[0];
    if (!robberRay) {
      PlayerUtils.sendToast(
        pl,
        "",
        "คุณเล็งที่ผู้เล่นในระยะ 3 บล็อคเพื่อใช้กุญแจมือ",
        "textures/items/tools/handcuff",
      );
      return;
    }
    const robber = robberRay.entity as Player;
    await this.arrestPlayer(pl, robber);
  }

  public handleTick(ev: { currentTick: number }) {
    if (ev.currentTick % 20 !== 0) return;
    for (const policeId in this.policeArrestDataManager.data) {
      //check is has comp
      const police = this.plugin.world
        .getAllPlayers()
        .find((pl) => pl.id === policeId);
      const robber = this.plugin.world
        .getAllPlayers()
        .find(
          (pl) =>
            pl.id === this.policeArrestDataManager.data[policeId]!.robberId,
        );
      if (!police) {
        this.policeArrestDataManager.removeArrestData(policeId);
        if (robber) this.stopArrest(undefined, robber);
        continue;
      }
      const rideableComp = police.getComponent(
        EntityRideableComponent.componentId,
      ) as EntityRideableComponent;
      if (!rideableComp) {
        this.stopArrest(police, robber);
        continue;
      }

      if (!police.hasComponent(EntityRideableComponent.componentId)) {
        this.stopArrest(police, robber);
        continue;
      }

      if (!robber) continue;
      rideableComp.addRider(robber);

      robber.playAnimation("animation.humanoid.arrest");
      police.playAnimation("animation.humanoid.police_arrest");
      robber.inputPermissions.setPermissionCategory(
        InputPermissionCategory.Movement,
        false,
      );

      if (police.isSneaking) {
        this.stopArrest(police, robber);
      }
    }
  }

  private stopArrest(pl?: Player, robber?: Player): void {
    if (pl) {
      const rideableComp = pl.getComponent(
        EntityRideableComponent.componentId,
      ) as EntityRideableComponent;
      if (rideableComp) {
        rideableComp.ejectRiders();
      }
      pl.triggerEvent("kisu:disable_arrest");
      this.policeArrestDataManager.removeArrestData(pl.id);
      pl.playAnimation("animation.empty_mnp_ci.mnp_ci");
    }
    if (robber) {
      robber.inputPermissions.setPermissionCategory(
        InputPermissionCategory.Movement,
        true,
      );
      robber.playAnimation("animation.empty_mnp_ci.mnp_ci");
    }
  }

  private async arrestPlayer(pl: Player, robber: Player): Promise<void> {
    pl.triggerEvent("kisu:enable_arrest");
    let attempts = 0;
    await new Promise<void>((resolve) => {
      const runId = this.plugin.system.runInterval(() => {
        if (pl.hasComponent(EntityRideableComponent.componentId)) {
          this.plugin.system.clearRun(runId);
          resolve();
          return;
        } else if (attempts >= 5) {
          pl.triggerEvent("kisu:disable_arrest");
          this.plugin.system.clearRun(runId);
          resolve();
          return;
        } else {
          attempts++;
        }
      });
    });
    const rideableComp = pl.getComponent(
      EntityRideableComponent.componentId,
    ) as EntityRideableComponent;
    rideableComp.addRider(robber);
    this.policeArrestDataManager.setArrestData(pl.id, robber.id);
  }
}

export { PoliceArrestManager };
