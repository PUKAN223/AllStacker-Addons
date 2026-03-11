import { PlayerUtils, PluginBase } from "@axeth/api";
import {
  ButtonState,
  EntityDieAfterEvent,
  InputButton,
  InputPermissionCategory,
  Player,
  PlayerButtonInputAfterEvent,
  PlayerSpawnAfterEvent,
  system,
  world,
} from "@minecraft/server";
import { type DeathData, PlayerDiedDataManager } from "./PlayerDiedDataManager.ts";

interface CustomPlayerDiedEvent {
  player: Player;
  reviver: Player;
  onReviveSuccess: () => void;
}

class RevivePlayerManagers {
  private plugin: PluginBase;
  private playerDiedDataManager: PlayerDiedDataManager;

  private readonly playerDeathTimeoutTicks = 20 * 60 * 20; // 20 minutes
  private readonly doctorTag = "medic";

  private constructor(plugin: PluginBase) {
    this.plugin = plugin;
    this.playerDiedDataManager = PlayerDiedDataManager.initialize(plugin);
    this.setupCustomEvents();
  }

  static initialize(plugin: PluginBase): RevivePlayerManagers {
    return new RevivePlayerManagers(plugin);
  }

  public handlePlayerDied(ev: EntityDieAfterEvent) {
    const dead = ev.deadEntity;
    const playerID = dead.id;

    if (!this.playerDiedDataManager.isPlayerInDeathState(playerID)) {
      this.playerDiedDataManager.setPlayerDeathData(playerID, {
        deathTick: this.plugin.system.currentTick,
        location: dead.location,
        reviveData: {
          reviving: false,
          reviveState: 0,
          reviver: null,
        },
        lastNotifiedTick: 0,
      });
      dead.triggerEvent("kisu:enable_resistance");
      return;
    }

    // กรณีตายซ้ำตอนยังอยู่ death state
    console.warn("TODO: Handle multiple deaths for the same player");
    const old = this.playerDiedDataManager.getPlayerDeathData(dead as Player);
    if (old) dead.teleport(old.location);
    this.stopDeathStateForPlayer(dead as Player);
  }

  private handlePlayerReviveSuccess(pl: Player, reviver: Player) {
    // เคลียร์ UI ทั้งคู่ก่อน ลดโอกาสค้าง/ซ้อน
    this.stopUIForPlayer(pl);
    this.stopUIForPlayer(reviver);

    this.stopDeathStateForPlayer(pl);

    PlayerUtils.sendToast(pl, ``, `§aคุณได้รับการช่วยชีวิตโดย §f${reviver.name}§a!`);
    PlayerUtils.sendToast(reviver, ``, `§aคุณได้ช่วยชีวิต §f${pl.name} §aเรียบร้อย!`);
  }

  public handleTick() {
    const revivedThisTick = new Set<string>();
    const nowTick = this.plugin.system.currentTick;
    const players = world.getAllPlayers();

    // หา “หมอ” ที่กำลังกดย่อ และไม่กำลังแบกคน
    const medics = players
      .filter((x) => x.isValid)
      .filter((x) => x.isSneaking)
      .filter((x) => x.hasTag(this.doctorTag) && !x.hasTag("carrying_player"));

    for (const medic of medics) {
      const target = players.find((p) => {
        if (!p.isValid) return false;
        if (!this.playerDiedDataManager.isPlayerInDeathState(p.id)) {
          return false;
        }

        const deathData = this.playerDiedDataManager.getPlayerDeathData(p);
        if (!deathData) return false;

        // ถ้ามีคน revive อยู่แล้ว และไม่ใช่หมอคนนี้ -> ไม่ให้แย่ง
        if (
          deathData.reviveData.reviver &&
          deathData.reviveData.reviver !== medic.id
        ) return false;

        return this.getDistanceBetweenPlayers(medic, p) <= 5;
      });

      if (!target) continue;

      revivedThisTick.add(target.id);

      this.plugin.events.emit<"CustomPlayerDied", CustomPlayerDiedEvent>(
        "CustomPlayerDied",
        {
          player: target,
          reviver: medic,
          onReviveSuccess: () => this.handlePlayerReviveSuccess(target, medic),
        },
      );
    }

    // จัดการคนตายทุกคน
    for (const playerId of Object.keys(this.playerDiedDataManager.data)) {
      const pl = players.find((p) => p.id === playerId);
      if (!pl || !pl.isValid) continue;

      const deathData = this.playerDiedDataManager.getPlayerDeathData(pl);
      if (!deathData) continue;

      const reviver = deathData.reviveData.reviver
        ? players.find((p) => p.id === deathData.reviveData.reviver)
        : null;

      // ถ้า tick นี้ไม่มีการ revive แล้วก่อนหน้านี้กำลัง revive อยู่ -> ยกเลิก revive UI และเคลียร์ “ทั้งคู่”
      if (!revivedThisTick.has(playerId) && reviver) {
        if (
          deathData.reviveData.reviving || deathData.reviveData.reviveState > 0
        ) {
          deathData.reviveData.reviving = false;
          deathData.reviveData.reviveState = 0;
          deathData.reviveData.reviver = null;

          this.playerDiedDataManager.setPlayerDeathData(playerId, deathData);

          // สำคัญ: เคลียร์ UI ของ “คนตาย” ด้วย ไม่งั้นค้าง/ซ้อน
          this.stopUIForPlayer(pl);
          this.stopUIForPlayer(reviver);
        }
      }

      // หมดเวลา -> ตายจริง
      if (nowTick >= deathData.deathTick + this.playerDeathTimeoutTicks) {
        this.stopDeathStateForPlayer(pl);
        pl.kill();
        continue;
      }

      // ล็อคการเดิน
      pl.inputPermissions.setPermissionCategory(
        InputPermissionCategory.Movement,
        false,
      );

      // tick effect + UI
      this.onPlayerDiedTick(pl, deathData);
    }
  }

  private getDistanceBetweenPlayers(a: Player, b: Player): number {
    const dx = a.location.x - b.location.x;
    const dy = a.location.y - b.location.y;
    const dz = a.location.z - b.location.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  public onPlayerDiedTick(player: Player, deathData: DeathData[string]) {
    player.playAnimation("animation.cbcl_rm.player_dead");
    player.addTag("dead_player");

    player.addEffect("blindness", 50, { amplifier: 1, showParticles: false });
    player.addEffect("instant_health", 50, {
      amplifier: 225,
      showParticles: false,
    });
    player.addEffect("resistance", 50, {
      amplifier: 225,
      showParticles: false,
    });

    this.showDeathUIToPlayer(player, deathData);
  }

  private showDeathUIToPlayer(player: Player, deathData: DeathData[string]) {
    if (!player.isValid) return;

    // ถ้ากำลัง revive อยู่ อย่าไปทับ UI
    if (deathData.reviveData.reviving) return;

    const remain = deathData.deathTick + this.playerDeathTimeoutTicks -
      this.plugin.system.currentTick;

    PlayerUtils.sendBottomBar(
      player,
      `§7คุณจะ§cตาย§7ในอีก ${this.tickToTimeString(remain)}\n` +
        `${
          this.getBarProgressFromTick(
            this.plugin.system.currentTick - deathData.deathTick,
            this.playerDeathTimeoutTicks,
          )
        }\n` +
        `§7กดย่อเพื่อเรียกหมอ`,
    );
  }

  private getBarProgressFromTick(
    tickElapsed: number,
    totalTicks: number,
  ): string {
    const totalBars = 12;
    if (totalTicks <= 0) return `${"§7░".repeat(totalBars)}§r`;

    const t = Math.min(Math.max(tickElapsed, 0), totalTicks);
    const filled = Math.min(
      totalBars,
      Math.max(0, Math.floor((t / totalTicks) * totalBars)),
    );

    // เขียว = ผ่านไปแล้ว, เทา = เหลือ
    return `${"§a█".repeat(filled)}${
      "§7░".repeat(Math.max(0, totalBars - filled))
    }§r`;
  }

  private getBarProgressFromPercent(value: number, max: number): string {
    const totalBars = 12;
    if (max <= 0) return `${"§7░".repeat(totalBars)}§r`;

    const v = Math.min(Math.max(value, 0), max);
    const filled = Math.min(
      totalBars,
      Math.max(0, Math.floor((v / max) * totalBars)),
    );
    return `${"§a█".repeat(filled)}${
      "§7░".repeat(Math.max(0, totalBars - filled))
    }§r`;
  }

  public stopDeathStateForPlayer(player: Player) {
    player.triggerEvent("kisu:disable_resistance");
    player.removeTag("dead_player");
    player.inputPermissions.setPermissionCategory(
      InputPermissionCategory.Movement,
      true,
    );
    player.playAnimation("animation.cbcl_rm.player_alive2");

    this.playerDiedDataManager.clearPlayerDeathData(player.id);

    // เคลียร์ UI ฝั่งคนตายแน่นอน
    this.plugin.system.run(() => this.stopUIForPlayer(player));
  }

  private stopUIForPlayer(player: Player) {
    if (!player || !player.isValid) return;
    system.run(() => {
      PlayerUtils.stopBottomBar(player);
      system.run(() => PlayerUtils.stopTopbar(player));
    });
  }

  private tickToTimeString(ticksRemain: number): string {
    const s = Math.max(0, Math.floor(ticksRemain / 20));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `§f${m} §7นาที §f${r} §7วินาที`;
  }

  public handleButtonInput(ev: PlayerButtonInputAfterEvent) {
    const pl = ev.player;
    if (!this.playerDiedDataManager.isPlayerInDeathState(pl.id)) return;

    if (
      ev.button === InputButton.Sneak &&
      ev.newButtonState === ButtonState.Pressed
    ) {
      const deathData = this.playerDiedDataManager.getPlayerDeathData(pl);
      if (!deathData) return;
      this.sendNoticeToMedic(pl, deathData);
    }
  }

  private sendNoticeToMedic(player: Player, deathData: DeathData[string]) {
    if (this.plugin.system.currentTick - deathData.lastNotifiedTick < 20 * 20) {
      PlayerUtils.sendToast(player, ``, "§cรอก่อน อย่าส่งซ้ำเร็วเกินไป!");
      return;
    }

    const medics = this.plugin.world.getAllPlayers().filter((p) =>
      p.hasTag(this.doctorTag) || p.id == player.id
    );
    for (const medic of medics) {
      medic.sendMessage(
        `§c[หมอ] §7ผู้เล่น §f${player.name} §7ต้องการความช่วยเหลือ!\n` +
          `    > §7ตำแหน่ง: §fX:${Math.floor(deathData.location.x)} Y:${
            Math.floor(deathData.location.y)
          } Z:${Math.floor(deathData.location.z)}`,
      );
      medic.playSound("random.pop");
    }

    deathData.lastNotifiedTick = this.plugin.system.currentTick;
    this.playerDiedDataManager.setPlayerDeathData(player.id, deathData);
  }

  public handlePlayerSpawned(ev: PlayerSpawnAfterEvent) {
    if (ev.initialSpawn) return;

    const pl = ev.player;
    if (this.playerDiedDataManager.isPlayerInDeathState(pl.id)) {
      const deathData = this.playerDiedDataManager.getPlayerDeathData(pl);
      if (deathData) pl.teleport(deathData.location);
      return;
    }

    pl.playAnimation("animation.cbcl_rm.player_alive2");
  }

  private showRevivingUIToPlayer(player: Player, reviver: Player) {
    const state = this.playerDiedDataManager.getPlayerDeathData(player);
    if (!state) return;

    // กันซ้อน: เคลียร์ก่อนแล้วค่อยส่ง
    this.stopUIForPlayer(player);
    this.stopUIForPlayer(reviver);

    const msg = `§fกำลังช่วยชีวิต\n` +
      `${this.getBarProgressFromPercent(state.reviveData.reviveState, 5)}`;

    PlayerUtils.sendBottomBar(player, msg);
    PlayerUtils.sendBottomBar(reviver, msg);
  }

  public setupCustomEvents() {
    this.plugin.events.on<"CustomPlayerDied", CustomPlayerDiedEvent>(
      "CustomPlayerDied",
      (ev) => {
        const deathData = this.playerDiedDataManager.getPlayerDeathData(
          ev.player,
        );
        if (!deathData) return;

        deathData.reviveData.reviving = true;
        deathData.reviveData.reviveState += 1;
        deathData.reviveData.reviver = ev.reviver.id;

        this.playerDiedDataManager.setPlayerDeathData(ev.player.id, deathData);
        this.showRevivingUIToPlayer(ev.player, ev.reviver);

        if (deathData.reviveData.reviveState >= 5) {
          system.run(() => ev.onReviveSuccess());
        }
      },
    );
  }
}

export { RevivePlayerManagers };
