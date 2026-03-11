import {
  ButtonState,
  Entity,
  EntityEquippableComponent,
  EquipmentSlot,
  InputButton,
  ItemDurabilityComponent,
  ItemStack,
  ItemStopUseAfterEvent,
  ItemUseBeforeEvent,
  Player,
  PlayerButtonInputAfterEvent,
  system,
  type Vector3,
} from "@minecraft/server";
import { PlayerFishingUtils } from "./PlayerUtilFishing.ts";
import { IActionForm, IModalForm, PlayerUtils, PluginBase } from "@axeth/api";
import { PlayerFishingState } from "./PlayerFishingState.ts";
import { CameraState } from "../types/CameraState.ts";
import { type FishingLootItem, FishingLootManager } from "./FishingLootManager.ts";

type BarConfig = {
  char: string;
  condition: (index: number, rand: number) => boolean;
};

type FishProgressState = {
  index: number;
  flip: boolean;
  round: number;
  success: number;
  lastSoundTick: number;
  bar: BarConfig;
};

class FishSystemManagers {
  private playerStates: PlayerFishingState;
  private playerFishingUtils;
  private fishingLootManager: FishingLootManager;
  private plugin!: PluginBase;

  private fishStartBiteTime = new Map<Entity, number>();
  private fishProgress = new Map<Entity, FishProgressState>();
  private registeredBars: BarConfig[] = [];
  private readonly defaultBar: BarConfig = {
    char: "",
    condition: (index, rand) => {
      if (index >= -4 && index <= 4) return true;
      if (index >= -12 && index <= 12) return rand <= 60;
      if (index >= -20 && index <= 20) return rand <= 40;
      return false;
    },
  };
  private readonly config = {
    sounds: {
      fishing_rod_charging: "mnp_ci.fishing_rod_charging",
      cast_fail: "mnp_ci.cast_fail",
      fishing_rod_swish: "mnp_ci.fishing_rod_swish",
      reel_complete: "mnp_ci.reel_complete",
      lure_splash: "mnp_ci.lure_splash",
      fish_alert: "mnp_ci.fish_alert",
      fish_bite: "mob.mnp_ci.fish_shared.flop",
      reel: "mnp_ci.reel",
      reel_pull: "mnp_ci.reel_pulling",
      fish_splash: "mnp_ci.release_fish_splash",
      fish_appear: "mnp_ci.fish_appears",
    },
    entity: {
      hook_type: "kisu:lure_marker",
    },
    setting: {
      max_charge_duration: 18,
    },
  };

  private constructor(plugin: PluginBase) {
    this.playerStates = PlayerFishingState.initialize();
    this.playerFishingUtils = PlayerFishingUtils.initialize();
    this.fishingLootManager = FishingLootManager.initialize(plugin);

    this.plugin = plugin;

    system.run(() => {
      this.plugin.playerManagers.eachPlayer((pl) => this.stopFishing(pl));
    });
  }

  static initialize(plugin: PluginBase) {
    return new FishSystemManagers(plugin);
  }

  public registerBar(
    barChar: string,
    condition: (index: number, rand: number) => boolean,
  ) {
    this.registeredBars.push({ char: barChar, condition });
  }

  public showFishingAdvancedSettings(pl: Player) {
    const lootData = this.fishingLootManager.getFishingLoot();
    const advancedUi = IActionForm.createForm(
      "การตั้งค่าขั้นสูง",
      "การตั้งค่าขั้นสูงสำหรับระบบตกปลา",
    );
    advancedUi.addButton("§cปิด", "textures/ui/realms_red_x");
    advancedUi.addDivider();
    advancedUi.addButton(
      `§fของดรอปจากการตกปลา : §c${lootData.length}`,
      "textures/items/fish_raw",
    );
    advancedUi.addButton(
      `§fเพิ่มของดรอปจากการตกปลา`,
      "textures/ui/color_plus",
      () => {
        this.showFishingAddLoot(pl);
      },
    );
    advancedUi.addDivider();
    lootData.forEach((loot) => {
      advancedUi.addButton(
        `§e${this.itemIdToName(loot.itemId)}§r\nอัตราดร็อป: ${loot.dropRate}%%`,
        loot.icon,
        () => {
          this.showFishingActionSettings(pl, loot.itemId);
        },
      );
    });

    advancedUi.show(pl);
  }

  private itemIdToName(itemId: string): string {
    return itemId.split(":")[1]!.split("_").map((word) =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  }

  public showFishingActionSettings(pl: Player, lootItemId: string) {
    const actionUi = IActionForm.createForm(
      "การตั้งค่าการตกปลา",
      "จัดการของดร็อปจากการตกปลาที่เลือก",
    );
    actionUi.addDivider();
    actionUi.addButton(
      `ย้อนกลับ`,
      "",
      this.showFishingAdvancedSettings.bind(this, pl),
    );
    actionUi.addDivider();
    actionUi.addButton("เเก้ไขของดร็อป", "textures/ui/book_edit_default", () => {
      this.showFishingAddLoot(
        pl,
        this.fishingLootManager.getFishingLoot().find((item) =>
          item.itemId === lootItemId
        ),
      );
    });
    actionUi.addButton("ลบของดร็อป", "textures/ui/icon_trash", () => {
      this.fishingLootManager.removeFishingLoot(lootItemId);
      PlayerUtils.sendToast(
        pl,
        ``,
        `§aลบ ${this.itemIdToName(lootItemId)} เรียบร้อยแล้ว!`,
      );
      this.showFishingAdvancedSettings(pl);
    });
    actionUi.show(pl);
  }

  public showFishingAddLoot(pl: Player, editData?: FishingLootItem) {
    const formValues = {
      itemDrop: editData ? editData.itemId : undefined,
      iconDrop: editData ? editData.icon : undefined,
      dropRate: editData ? editData.dropRate : undefined,
    };
    const addLootUi = IModalForm.createForm(
      editData ? "แก้ไขของดรอปจากการตกปลา" : "เพิ่มของดรอปจากการตกปลา",
      editData ? "แก้ไข" : "เพิ่ม",
    );
    addLootUi.addTextField(
      {
        label: "ไอดีไอเท็มดร็อป",
        placeholderText: "minecraft:cod",
        defaultValue: formValues.itemDrop,
      },
      (value) => {
        formValues.itemDrop = value;
      },
    );
    addLootUi.addTextField(
      {
        label: "ไอคอนไอเท็มดร็อป (ถ้ามี)",
        placeholderText: "textures/items/fish_raw",
        defaultValue: formValues.iconDrop,
      },
      (value) => {
        formValues.iconDrop = value;
      },
    );
    addLootUi.addTextField(
      {
        label: "อัตราการดรอป (%%)",
        placeholderText: "50",
        defaultValue: editData ? editData.dropRate.toString() : undefined,
      },
      (value) => {
        formValues.dropRate = parseFloat(value);
      },
    );
    addLootUi.show(pl).then((res) => {
      if (!res || res.canceled) return;

      const itemId = formValues.itemDrop;
      const icon = formValues.iconDrop ?? "";
      const dropRate = formValues.dropRate ?? NaN;

      if (!itemId) {
        PlayerUtils.sendToast(pl, ``, "§cกรุณากรอกไอดีไอเท็มให้ถูกต้อง!");
        return;
      } else if (isNaN(dropRate) || dropRate <= 0 || dropRate > 100) {
        PlayerUtils.sendToast(pl, ``, "§cกรุณากรอกอัตราการดรอปให้ถูกต้อง (0-100)!");
        return;
      }
      if (editData) {
        this.fishingLootManager.removeFishingLoot(editData.itemId);
      }
      this.fishingLootManager.addFishingLoot({
        itemId,
        icon,
        dropRate,
      });
      PlayerUtils.sendToast(
        pl,
        ``,
        editData
          ? `§aแก้ไขไอเท็มในรายการของดรอปเรียบร้อยแล้ว!`
          : "§aเพิ่มไอเท็มลงในรายการของดรอปเรียบร้อยแล้ว!",
        icon,
      );
      this.showFishingAdvancedSettings(pl);
    });
  }

  public handleBeforeUseRod(ev: ItemUseBeforeEvent) {
    const player = ev.source;
    if (
      !this.playerFishingUtils.isUsedFishingRod(
        ev.itemStack,
        "kisu:fishing_rod",
      )
    ) return;

    const state = this.playerStates.getOrCreateState(player);
    if (state.isCasted) return;

    // ✅ set ทันที ไม่รอ tick ถัดไป
    if (state.rodStartTick === 0) {
      this.playerStates.setState(player, { rodStartTick: system.currentTick });
    }

    // animation/sound จะ run ก็ได้ แต่ "ค่าเริ่มง้าง" ต้องมาก่อน
    system.run(() => {
      player.playSound(this.config.sounds.fishing_rod_charging);
      player.playAnimation(
        "animation.player_mnp_ci.mnp_ci.third_person.reset_arms",
        {
          controller: "third_person_casted_arm_reset",
          stopExpression: "!v.__is_c",
          blendOutTime: 0,
        },
      );
      player.playAnimation(
        "animation.player_mnp_ci.mnp_ci.third_person.charge",
        {
          controller: "third_person_casted",
          stopExpression: "q.item_in_use_duration <= 0",
          blendOutTime: 0,
        },
      );
    });
  }

  public handleTick(currentTick: number) {
    currentTick;
    this.plugin.playerManagers.eachPlayer((pl) => {
      this.playerStates.handlePlayerVariables(
        pl,
        this.playerStates.getOrCreateState(pl),
      );
    });
  }

  public handlePlayerButtonInput(ev: PlayerButtonInputAfterEvent) {
    const player = ev.player;

    if (ev.newButtonState !== ButtonState.Pressed) return;
    const state = this.playerStates.getOrCreateState(player);
    if (ev.button === InputButton.Sneak) {
      if (state.isCasted && state.hasFishPulling) {
        if (state.hookEntity && this.isHookFishBiting(state.hookEntity)) {
          // console.warn("Fish is biting the hook!");
          return;
        }

        if (state.hookEntity && state.hasFishPulling) {
          this.resolveReelAttempt(player, state.hookEntity);
          return;
        } else {
          player.playSound(this.config.sounds.reel_complete);
          this.stopFishing(player);
          return;
        }
      }
    } else if (ev.button === InputButton.Jump) {
      if (state.isCasted) {
        PlayerUtils.sendToast(player, "", "§aคุณหยุดการตกปลาแล้ว!");
        this.stopFishing(player);
        return;
      }
    }
  }

  public handleAfterStopUseRod(ev: ItemStopUseAfterEvent) {
    const state = this.playerStates.getOrCreateState(ev.source);
    // console.warn(JSON.stringify(state))

    if (state.rodStartTick == 0 || state.hasFishPulling) return;
    const rodStartTick =
      this.playerStates.getOrCreateState(ev.source).rodStartTick;
    this.playerStates.setState(ev.source, { rodStartTick });
    const chargeDuration = Math.min(
      this.config.setting.max_charge_duration,
      system.currentTick - rodStartTick,
    );
    this.playerStates.resetPlayerAnimations(
      ev.source,
      "third_person_casted_arm_reset",
    );
    this.playerStates.resetPlayerAnimations(ev.source, "third_person_casted");
    this.playerFishingUtils.stopSound(
      this.config.sounds.fishing_rod_charging,
      ev.source,
    );
    // console.warn(`Stopped using fishing rod after ${chargeDuration} ticks`);
    if (chargeDuration <= 15) {
      // console.warn("Cancel casting fishing rod");
      ev.source.playSound(this.config.sounds.cast_fail, {
        pitch: 0.9 + Math.random() * 0.2,
      });
      this.playerStates.resetState(ev.source, {});
    } else {
      // console.warn("Perform cast fishing rod");
      ev.source.playSound(this.config.sounds.fishing_rod_swish, {
        pitch: 0.9 + Math.random() * 0.2,
      });
      this.performCast(ev.source, chargeDuration);
    }
  }

  private stopFishing(player: Player) {
    const hooks = this.getFishingHookEntity(player);
    if (hooks) {
      for (const hook of hooks) {
        this.fishProgress.delete(hook);
        hook.remove();
      }
    }

    this.playerStates.resetState(player, {});
    this.playerStates.setCamera(player, CameraState.Stop);
    this.stopUI(player);
  }

  private stopUI(player: Player) {
    system.run(() => {
      PlayerUtils.stopTopbar(player);
      system.run(() => {
        PlayerUtils.stopTopbar(player);
        PlayerUtils.stopBottomBar(player);
      });
    });
  }

  private getProgress(hook: Entity): FishProgressState {
    const existing = this.fishProgress.get(hook);
    if (existing) return existing;

    const initial: FishProgressState = {
      index: -44,
      flip: false,
      round: 0,
      success: 0,
      lastSoundTick: 0,
      bar: this.pickRandomBar(),
    };

    this.fishProgress.set(hook, initial);
    return initial;
  }

  private pickRandomBar(): BarConfig {
    if (this.registeredBars.length === 0) return this.defaultBar;
    const idx = Math.floor(Math.random() * this.registeredBars.length);
    return this.registeredBars[idx] || this.defaultBar;
  }

  private getFishingHookEntity(player: Player): Entity[] | null {
    const playerId = player.id;
    const hooks = player.dimension.getEntities({
      tags: ["owner_hook:" + playerId],
    });
    return hooks.length ? hooks : null;
  }

  private isHookFishBiting(hook: Entity): boolean {
    const biteTime = this.fishStartBiteTime.get(hook);
    if (biteTime && system.currentTick - biteTime <= 25) {
      this.fishStartBiteTime.delete(hook);
      return true;
    }
    return false;
  }

  private onPulledFish(player: Player, hook: Entity) {
    const fishingLoot = this.fishingLootManager.pickRandomLoot();
    if (!fishingLoot) {
      PlayerUtils.sendToast(
        player,
        "§cตกปลาไม่สำเร็จ",
        "§7ไม่มีปลาติดเบ็ดขึ้นมาเลย...",
      );
      return;
    }
    const lootItem = new ItemStack(fishingLoot.itemId, 1);
    const fish = hook.dimension.spawnItem(lootItem, hook.location);
    fish.applyImpulse({
      x: (player.location.x - fish.location.x) * 0.1,
      y: (player.location.y - fish.location.y) * 0.1 + 0.2,
      z: (player.location.z - fish.location.z) * 0.1,
    });
    PlayerUtils.sendToast(
      player,
      "§aตกปลาสำเร็จ",
      `§7ได้รับ §e${this.itemIdToName(fishingLoot.itemId)} §7x§c1§r`,
      fishingLoot.icon,
    );

    this.plugin.system.run(() => this.stopFishing(player));
  }

  private handleHookBite(
    result: string | null,
    player: Player,
    hook: Entity,
  ): boolean {
    if (result !== "bite") return false;

    hook.addTag("is_attached");
    hook.applyImpulse({ x: 0, y: 0.5, z: 0 });
    player.playAnimation(
      "animation.player_mnp_ci.mnp_ci.third_person.reel_in_add",
      {
        controller: "third_person_reel_in_add",
        stopExpression: "q.main_hand_item_use_duration <= 0 || !v.__is_c",
        blendOutTime: 0,
      },
    );
    this.fishStartBiteTime.set(hook, system.currentTick);
    this.plugin.system.runTimeout(() => {
      player.playSound(this.config.sounds.fish_alert);
      this.playerStates.setState(player, {
        hasFishPulling: true,
      });
    }, 30);
    player.playSound(this.config.sounds.fish_bite, { volume: 2 });
    return true;
  }

  private handleReelMovement(
    player: Player,
    hook: Entity,
    progress: FishProgressState,
    runHookId: number,
  ): boolean {
    const state = this.playerStates.getOrCreateState(player);
    if (!hook.hasTag("is_attached") || !state.hasFishPulling) return true;

    if (progress.round >= 15) {
      PlayerUtils.sendToast(player, "§cตกปลาไม่สำเร็จ", "§7คุณกากเกินไป!");
      this.stopFishing(player);
      this.stopUI(player);
      this.plugin.system.clearRun(runHookId);
      return true;
    }

    this.updateProgressIndex(progress);
    this.playReelSound(player, state, progress);

    if (!this.getFishingHookEntity(player)) return true;

    if (progress.success >= 3) {
      this.stopUI(player);
      player.playSound(this.config.sounds.fish_appear);
      this.onPulledFish(player, hook);
      system.runTimeout(() => {
        this.playerStates.resetPlayerAnimations(
          player,
          "third_person_reel_in_add",
        );
        this.playerStates.resetPlayerAnimations(player, "third_person_reel");
      }, 20);
      this.plugin.system.clearRun(runHookId);
      return true;
    }

    this.sendReelTopbar(player, progress);
    return false;
  }

  private updateProgressIndex(progress: FishProgressState) {
    const currentIndex = progress.index;
    if (currentIndex >= 44) {
      progress.flip = true;
      progress.round++;
      progress.index = 43;
    } else if (currentIndex <= -44) {
      progress.flip = false;
      progress.round++;
      progress.index = -43;
    }

    const step = progress.success + 1;
    progress.index += progress.flip ? -step : step;
  }

  private playReelSound(
    player: Player,
    state: ReturnType<PlayerFishingState["getOrCreateState"]>,
    progress: FishProgressState,
  ) {
    if (system.currentTick - progress.lastSoundTick < 4) return;

    player.playSound(this.config.sounds.reel, {
      pitch: 0.9 + Math.random() * 0.2,
    });
    if (player.hasTag("pulse_reel_animation")) {
      system.runTimeout(() => {
        player.removeTag("pulse_reel_animation");
      }, 10);
    } else if (state.hasFishPulling) {
      player.playAnimation(
        "animation.player_mnp_ci.mnp_ci.third_person.reel_in_add",
        {
          blendOutTime: 1,
          controller: "third_person_reel_in_add",
        },
      );
    }
    progress.lastSoundTick = system.currentTick;
  }

  private sendReelTopbar(player: Player, progress: FishProgressState) {
    const leftPadding = Math.max(progress.index, 0);
    const rightPadding = Math.max(-progress.index, 0);
    const successBar = `${"§a█".repeat(progress.success)}${
      "§7░".repeat(3 - progress.success)
    }§r`;
    PlayerUtils.sendTopbar(
      player,
      `ความสำเร็จ ${successBar} (${progress.success}/3)\n${progress.bar.char}\n${
        " ".repeat(leftPadding)
      }${""}${" ".repeat(rightPadding)}${"\n".repeat(14)}§r`,
    );
  }

  private resetFishIndex(progress: FishProgressState, hook: Entity) {
    progress.index = progress.flip
      ? Math.floor(Math.random() * 45)
      : -Math.floor(Math.random() * 45);
    progress.flip = Math.random() < 0.5;
    progress.round++;
    progress.bar = progress.bar || this.pickRandomBar();
    this.fishProgress.set(hook, progress);
  }

  private getDistance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private addHookTask(player: Player, hook: Entity) {
    const hookManager = new FishHookManager(hook);
    const progress = this.getProgress(hook);
    progress.bar = progress.bar || this.pickRandomBar();
    const state = this.playerStates.getOrCreateState(player);

    const runHookId = system.runInterval(() => {
      if (!hook.isValid) {
        this.plugin.system.clearRun(runHookId);
        return;
      }
      if (
        state.startFishSlot !== player.selectedSlotIndex ||
        this.getDistance(player.location, hook.location) > 30
      ) {
        PlayerUtils.sendToast(player, "", "§aคุณหยุดการตกปลาแล้ว!");
        this.stopFishing(player);
        this.plugin.system.clearRun(runHookId);
        return;
      }

      const result = hookManager.handleTick();
      // console.warn(`Fish Hook Tick Result: ${result}`);

      if (this.handleHookBite(result, player, hook)) return;
      if (result !== null) {
        PlayerUtils.sendBottomBar(
          player,
          "§aกดย่อ§7เพื่อดึงปลา / §aกระโดด§7เพื่อหยุดจับปลา",
        );
        return;
      }
      if (this.handleReelMovement(player, hook, progress, runHookId)) return;
    }, 1);
  }

  private resolveReelAttempt(player: Player, hook: Entity) {
    const progress = this.getProgress(hook);

    const rand = Math.random() * 100;
    const bar = progress.bar || this.defaultBar;
    const isSuccess = bar.condition(progress.index, rand);

    this.resetFishIndex(progress, hook);

    player.playAnimation(
      "animation.player_mnp_ci.mnp_ci.third_person.reel_pose_add",
      {
        blendOutTime: 2,
        controller: "third_person_reel",
      },
    );
    player.addTag("pulse_reel_animation");

    if (isSuccess) {
      progress.success = Math.min(3, progress.success + 1);
      hook.applyImpulse({ x: 0, y: 0.4, z: 0 });
      player.playSound(this.config.sounds.reel_complete);
    } else {
      player.playSound(this.config.sounds.cast_fail);
      hook.applyImpulse({ x: 0, y: -0.2, z: 0 });
    }

    this.fishProgress.set(hook, progress);
  }

  private performCast(player: Player, chargeDuration: number) {
    this.playerStates.resetState(player, {
      startFishSlot: player.selectedSlotIndex,
    });
    this.playerStates.setState(player, {
      isCasted: true,
      castedRotation: player.getViewDirection(),
      hookEntity: undefined,
    });

    const equipment = player.hasComponent(EntityEquippableComponent.componentId)
      ? player.getComponent(EntityEquippableComponent.componentId)
      : null;
    const rodHold = equipment
      ? equipment.getEquipment(EquipmentSlot.Mainhand)
      : null;
    if (!rodHold) {
      this.stopFishing(player);
      return;
    }
    system.run(() => {
      const rodDamage =
        rodHold.getComponent(ItemDurabilityComponent.componentId)?.damage || 0;
      if (
        rodDamage + 1 >=
          rodHold.getComponent(ItemDurabilityComponent.componentId)!
            .maxDurability
      ) {
        PlayerUtils.sendToast(player, "", "§7คันเบ็ดของคุณพังแล้ว!");
        equipment?.setEquipment(EquipmentSlot.Mainhand, undefined);
        this.stopFishing(player);
        return;
      }
      rodHold.getComponent(ItemDurabilityComponent.componentId)!.damage =
        rodDamage + 1;
      equipment?.setEquipment(EquipmentSlot.Mainhand, rodHold);

      player.playAnimation("animation.player_mnp_ci.mnp_ci.third_person.cast", {
        controller: "third_person_casted",
        stopExpression: "0",
        blendOutTime: 0,
      });

      const spLocation = FishSystemManagers.locationOffsetByViewDirection(
        player,
        {
          x: -.65,
          y: -1,
          z: .25,
        },
      );
      const hook = player.dimension.spawnEntity(
        this.config.entity.hook_type,
        spLocation,
      );
      hook.addTag("owner_hook:" + player.id);
      const multiply = .12 * chargeDuration;
      hook.applyKnockback({
        x: player.getViewDirection().x * multiply,
        z: player.getViewDirection().z * multiply,
      }, 1);
      this.playerStates.setState(player, {
        hookEntity: hook,
      });

      let attempt = 0;
      const runHookId = system.runInterval(() => {
        if (!hook || !hook.isValid) this.plugin.system.clearRun(runHookId);
        if (hook && hook.isValid && hook.isInWater) {
          player.dimension.playSound(
            this.config.sounds.lure_splash,
            hook.location,
            {
              volume: 2,
            },
          );
          this.playerStates.setCamera(player, CameraState.Start, hook);
          this.addHookTask(player, hook);
          this.plugin.system.clearRun(runHookId);
        } else if (hook && hook.isValid && hook.isOnGround) {
          this.stopFishing(player);
          player.playSound(this.config.sounds.cast_fail, {
            pitch: 0.9 + Math.random() * 0.2,
          });
          this.plugin.system.clearRun(runHookId);
        } else {
          attempt++;
          if (attempt >= 10) this.plugin.system.clearRun(runHookId);
        }
      }, 5);

      system.runTimeout(() => {
        player.playAnimation(
          "animation.player_mnp_ci.mnp_ci.third_person.casted",
          {
            controller: "third_person_casted",
            stopExpression: "!v.__is_c",
            blendOutTime: 0,
          },
        );
      }, .7 * chargeDuration);
    });
  }

  static locationOffsetByViewDirection(
    player: Entity,
    offset: Vector3,
  ): Vector3 {
    const headLoc = player.getHeadLocation();
    const viewDir = player.getViewDirection();

    const length = Math.sqrt(
      viewDir.x * viewDir.x + viewDir.y * viewDir.y + viewDir.z * viewDir.z,
    );
    const forward = {
      x: viewDir.x / length,
      y: viewDir.y / length,
      z: viewDir.z / length,
    };

    const up = { x: 0, y: 1, z: 0 };
    const right = {
      x: up.y * forward.z - up.z * forward.y,
      y: up.z * forward.x - up.x * forward.z,
      z: up.x * forward.y - up.y * forward.x,
    };

    const actualUp = {
      x: forward.y * right.z - forward.z * right.y,
      y: forward.z * right.x - forward.x * right.z,
      z: forward.x * right.y - forward.y * right.x,
    };

    return {
      x: headLoc.x + right.x * offset.x + actualUp.x * offset.y +
        forward.x * offset.z,
      y: headLoc.y + right.y * offset.x + actualUp.y * offset.y +
        forward.y * offset.z,
      z: headLoc.z + right.z * offset.x + actualUp.z * offset.y +
        forward.z * offset.z,
    };
  }
}

class FishHookManager {
  private hook: Entity;
  private startTask = system.currentTick;
  private fishBiteTime = this.getFishBiteTime();

  constructor(hook: Entity) {
    this.hook = hook;
  }

  public handleTick() {
    // console.warn("Handling fish hook tick");
    if (!this.hook.isValid) return null;

    // console.warn(`Current Tick: ${system.currentTick}, Fish Bite Time: ${this.fishBiteTime}`);
    if (this.hook.hasTag("is_attached")) return null;
    if (system.currentTick >= this.fishBiteTime) {
      return "bite";

      //when nearly 100 ticks particle show
    } else if (system.currentTick >= this.fishBiteTime - 100) {
      return "near_bite";
    } else {
      return "waiting";
    }
  }

  private getFishBiteTime(): number {
    return system.currentTick + 100 + Math.floor(Math.random() * 200);
  }
}

export { FishSystemManagers };
