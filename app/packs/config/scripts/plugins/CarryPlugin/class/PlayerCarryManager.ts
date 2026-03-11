import { IActionForm, PlayerUtils, PluginBase } from "@axeth/api";
import { Player, world } from "@minecraft/server";
import { FormCancelationReason } from "@minecraft/server-ui";
import { PlayerCarryDataManager } from "./PlayerCarryDataManager.ts";

class PlayerCarryManager {
  private plugin: PluginBase;

  private carryTickInterval: number = 20; // ticks
  private playerCarryDataManager;

  private constructor(plugin: PluginBase) {
    this.plugin = plugin;

    this.playerCarryDataManager = PlayerCarryDataManager.initialize(
      this.plugin,
    );
  }

  static initialize(plugin: PluginBase): PlayerCarryManager {
    return new PlayerCarryManager(plugin);
  }

  public showRequestCarryUI(owner: Player, player: Player) {
    const requestUI = IActionForm.createForm(
      "§a§c§t§i§o§n§r§8การกระทำ §eอุ้มผู้เล่น",
    );
    requestUI.addLabel(` §e${owner.nameTag} §aต้องการอุ้มคุณ\n คุณต้องการอุ้มหรือไม่?`);
    requestUI.addButton(
      "§aยอมรับ",
      ``,
      () => this.handleCarryRequestAccepted(owner, player),
    );
    requestUI.addButton(
      "§cปฏิเสธ",
      ``,
      () => this.handleCarryRequestDenied(owner),
    );
    requestUI.show(player).then((result) => {
      if (result.cancelationReason === FormCancelationReason.UserBusy) {
        PlayerUtils.sendToast(owner, ``, "§cผู้เล่นไม่ว่างในขณะนี้");
        return;
      }
      if (result.canceled) return;
    });
  }

  private handleCarryRequestAccepted(owner: Player, player: Player) {
    owner.playSound("random.orb");
    player.playSound("random.orb");

    this.startCarryingPlayer(owner, player);
  }

  public handleTick(ev: { currentTick: number }) {
    if (ev.currentTick % this.carryTickInterval !== 0) return;
    const playerCarryData = this.playerCarryDataManager.getCarriesData();
    for (const [ownerId, carryData] of Object.entries(playerCarryData)) {
      const owner = this.plugin.world.getPlayers().find((p) =>
        p.id === ownerId
      );
      const player = this.playerCarryDataManager.getPlayerCarried(ownerId);
      if (!owner) {
        console.warn(
          `[CarryPlugin] Owner player with ID ${ownerId} not found. Clearing carry data.`,
        );
        this.playerCarryDataManager.clearCarryData(ownerId);
        // console.log
        if (player) player.runCommand(`ride @s stop_riding `);
        continue;
      }
      const rideComp = owner.getComponent("minecraft:rideable");

      if (
        !player ||
        !owner.hasTag("carrying_player") ||
        owner.isSneaking ||
        !rideComp ||
        rideComp.getRiders().length === 0
      ) {
        this.stopCarryingPlayer(owner);
        [owner].forEach((p) => p.playSound("random.orb"));
        continue;
      }

      if (carryData.isDeathState) {
        owner.playAnimation("animation.cbcl_rm.player_carry");
      } else {
        owner.playAnimation("animation.cbcl.rm.player_carry2");
      }
    }

    world.getAllPlayers().filter((p) => p.hasTag("carrying_player")).forEach(
      (p) => {
        if (!this.playerCarryDataManager.hasCarryData(p.id)) {
          p.removeTag("carrying_player");
          this.stopCarryingPlayer(p);
        }
      },
    );
  }

  public startCarryingPlayer(
    owner: Player,
    player: Player,
    isDeathState: boolean = false,
  ) {
    owner.triggerEvent(
      "kisu:enable_carry" + (isDeathState ? "_death" : "_normal"),
    );

    let attempt = 0;
    const runId = this.plugin.system.runInterval(() => {
      const rideComp = owner.getComponent("minecraft:rideable");
      if (!rideComp) {
        attempt++;
        if (attempt >= 5) {
          this.plugin.system.clearRun(runId);
          this.stopCarryingPlayer(owner);
        }
        return;
      }
      rideComp.addRider(player);
      this.playerCarryDataManager.setCarryData(owner, player, isDeathState);
      owner.addTag("carrying_player");
      owner.onScreenDisplay.setActionBar(`กดย่อเพื่อยกเลิกการอุ้ม`);
      this.plugin.system.clearRun(runId);
    }, 5);
  }

  private stopCarryingPlayer(owner: Player) {
    const rideComp = owner.getComponent("minecraft:rideable");
    if (!rideComp) return;
    rideComp.ejectRiders();
    owner.triggerEvent("kisu:disable_carry_normal");
    owner.triggerEvent("kisu:disable_carry_death");
    owner.playAnimation("animation.empty_mnp_ci.mnp_ci");
    owner.removeTag("carrying_player");
    this.playerCarryDataManager.clearCarryData(owner.id);
  }

  private handleCarryRequestDenied(owner: Player) {
    PlayerUtils.sendToast(owner, ``, "§cผู้เล่นปฏิเสธคำขออุ้ม");
  }
}

export { PlayerCarryManager };
