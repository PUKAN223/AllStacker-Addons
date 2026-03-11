import { IActionForm, IModalForm, PlayerUtils, PluginBase } from "@axeth/api";
import { Dimension, Player, system, type Vector3 } from "@minecraft/server";
import { CropSpawnerDataManager } from "./CropSpawnerDataManager.ts";
import { FarmCropManagers } from "./FarmCropManagers.ts";
import type { CropSpawnerData } from "../types/CropSpawnerData.ts";

type RangeSelectionState = {
  start: Vector3 | null;
  end: Vector3 | null;
  completed: boolean;
};

type SpawnerRuntimeCache = {
  center: Vector3;
  radius: number;
  supportBlockSet: Set<string>;
  nextSpawnTick: number;
};

type SpawnerEntry = { key: string; data: CropSpawnerData };

class CropSpawner {
  private readonly plugin: PluginBase;
  private readonly dataManager: CropSpawnerDataManager;
  private readonly cropManager: FarmCropManagers;

  private readonly selectionModeByPlayerId = new Map<
    string,
    RangeSelectionState
  >();

  private readonly runtimeBySpawnerKey = new Map<string, SpawnerRuntimeCache>();

  private readonly tickConfig = {
    spawnScanEveryTicks: 10,
    uiEveryTicks: 20,
    nearCropCheckDistance: 3,
  };

  private constructor(plugin: PluginBase, cropManager: FarmCropManagers) {
    this.plugin = plugin;
    this.dataManager = new CropSpawnerDataManager(plugin);
    this.cropManager = cropManager;
    this.registerEvents();
  }

  static initialize(
    plugin: PluginBase,
    cropManager: FarmCropManagers,
  ): CropSpawner {
    return new CropSpawner(plugin, cropManager);
  }

  private registerEvents() {
    this.plugin.events.on("BeforePlayerBreakBlock", (ev) => {
      const playerId = ev.player.id;
      const state = this.selectionModeByPlayerId.get(playerId);
      if (!state) return;

      ev.cancel = true;

      const blockPos = ev.block.location;

      system.run(() => {
        const current = this.selectionModeByPlayerId.get(playerId);
        if (!current) return;

        if (!current.start) {
          current.start = blockPos;
          PlayerUtils.sendToast(
            ev.player,
            "",
            `ตั้งค่าจุดเริ่มต้นที่ (${blockPos.x}, ${blockPos.y}, ${blockPos.z})`,
          );
        } else if (!current.end) {
          current.end = blockPos;
          current.completed = true;
          PlayerUtils.stopBottomBar(ev.player);
          PlayerUtils.sendToast(
            ev.player,
            "",
            `ตั้งค่าจุดสิ้นสุดที่ (${blockPos.x}, ${blockPos.y}, ${blockPos.z})`,
          );
        }

        this.selectionModeByPlayerId.set(playerId, current);
      });
    });

    this.plugin.events.on("AfterTick", ({ currentTick }) => {
      const doSpawnScan =
        currentTick % this.tickConfig.spawnScanEveryTicks === 0;
      const doUi = currentTick % this.tickConfig.uiEveryTicks === 0;

      if (doSpawnScan) this.handleSpawnScan(currentTick);
      if (doUi) this.handleSelectionUi();
    });
  }

  private handleSpawnScan(currentTick: number) {
    const players = this.plugin.world.getPlayers();
    if (players.length === 0) return;

    const scheduledSpawnerKeys = new Set<string>();

    for (const player of players) {
      const spawnersNearPlayer = this.dataManager.getCropDataByRange(
        player.location,
      );
      if (!spawnersNearPlayer) continue;

      for (const spawner of spawnersNearPlayer) {
        if (scheduledSpawnerKeys.has(spawner.key)) continue;
        scheduledSpawnerKeys.add(spawner.key);

        const runtime = this.getOrCreateRuntime(
          spawner.key,
          spawner.data,
          currentTick,
        );
        if (currentTick < runtime.nextSpawnTick) continue;

        const cropCount = this.countCropsInSpawnerRange(
          player.dimension,
          spawner,
          runtime,
        );
        if (cropCount >= spawner.data.maxCrops) {
          runtime.nextSpawnTick = currentTick + spawner.data.spawnInterval;
          continue;
        }

        const spawned = this.spawnCropInRange(
          spawner.data,
          player.dimension,
          runtime,
        );
        runtime.nextSpawnTick = currentTick + spawner.data.spawnInterval;

        if (!spawned) continue;
      }
    }
  }

  private countCropsInSpawnerRange(
    dimension: Dimension,
    spawner: SpawnerEntry,
    runtime: SpawnerRuntimeCache,
  ): number {
    const candidates = dimension.getEntities({
      type: spawner.data.cropId,
      location: runtime.center,
      maxDistance: runtime.radius,
    });

    let count = 0;
    for (const e of candidates) {
      if (
        this.dataManager.isInRange(
          e.location,
          spawner.data.rangeLocation.start,
          spawner.data.rangeLocation.end,
        )
      ) {
        count++;
        if (count >= spawner.data.maxCrops) return count;
      }
    }
    return count;
  }

  private spawnCropInRange(
    spawner: CropSpawnerData,
    dimension: Dimension,
    runtime: SpawnerRuntimeCache,
  ): boolean {
    const spawnLocation = this.pickSpawnLocation(
      dimension,
      spawner.cropId, // ✅ ส่ง cropId เข้าไป
      spawner.rangeLocation.start,
      spawner.rangeLocation.end,
      runtime.supportBlockSet,
      0.65, // ✅ กันซ้อนจุดเดียวกัน (ปรับได้)
    );
    if (!spawnLocation) return false;

    const cropInfo = this.cropManager.getCropOptions(spawner.cropId);
    if (!cropInfo) return false;

    const entity = dimension.spawnEntity(spawner.cropId, spawnLocation);

    // ✅ สำคัญ: ใส่ tag ให้ระบบตรวจใกล้ ๆ ได้ (ถ้าคุณยังอยากใช้ tags)
    entity.addTag("crops");
    entity.addTag(`spawner:${spawner.cropId}`);

    entity.nameTag = this.plugin.mcColors(`${cropInfo.name}`).yellow;

    dimension.playSound("random.pop", spawnLocation, { volume: 0.5, pitch: 1 });
    return true;
  }

  private pickSpawnLocation(
    dimension: Dimension,
    cropId: string, // ✅ เพิ่ม param
    start: Vector3,
    end: Vector3,
    supportBlockSet: Set<string>,
    minDistance: number, // ✅ ระยะกันซ้อน
  ): Vector3 | null {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    const minZ = Math.min(start.z, end.z);
    const maxZ = Math.max(start.z, end.z);

    for (let attempt = 0; attempt < 30; attempt++) {
      const x = this.randomInt(minX, maxX);
      const z = this.randomInt(minZ, maxZ);
      const y = this.randomInt(minY, maxY);

      // ✅ หา y ที่วางได้ก่อน
      const validY = this.findValidY(dimension, x, y, z, supportBlockSet);
      if (validY === null) continue;

      const candidate = { x: x + 0.5, y: validY, z: z + 0.5 };

      // ✅ กัน “ซ้อนกันจุดเดียวกัน”: เช็ค entity cropId ใกล้มาก ๆ
      const alreadyThere = dimension.getEntities({
        type: cropId,
        location: candidate,
        maxDistance: minDistance,
      });
      if (alreadyThere.length > 0) continue;

      // (ถ้าคุณอยากกันซ้อนกับ “ทุกชนิดพืช” ด้วย ให้ใช้ tags แทน/เพิ่ม)
      // const anyCropNear = dimension.getEntities({ tags: ["crops"], location: candidate, maxDistance: minDistance });
      // if (anyCropNear.length > 0) continue;

      return candidate;
    }

    return null;
  }
  private findValidY(
    dimension: Dimension,
    x: number,
    yStart: number,
    z: number,
    supportBlockSet: Set<string>,
  ): number | null {
    let y = yStart;

    for (let depth = 0; depth < 20; depth++) {
      const block = dimension.getBlock({ x, y, z });
      const support = dimension.getBlock({ x, y: y - 1, z });

      if (!block || !support) return null;

      if (support.isAir) {
        y -= 1;
        continue;
      }

      if (!block.isAir) {
        y += 1;
        continue;
      }

      return supportBlockSet.has(support.typeId) ? y : null;
    }

    return null;
  }

  private getOrCreateRuntime(
    key: string,
    data: CropSpawnerData,
    currentTick: number,
  ): SpawnerRuntimeCache {
    const existing = this.runtimeBySpawnerKey.get(key);
    if (existing) return existing;

    const center = this.computeCenter(
      data.rangeLocation.start,
      data.rangeLocation.end,
    );
    const radius = this.computeRadius(
      center,
      data.rangeLocation.start,
      data.rangeLocation.end,
    ) + 1.5;

    const supportBlockSet = new Set(
      ["minecraft:soul_soil"].map((s) => s.trim()).filter(Boolean),
    );

    const runtime: SpawnerRuntimeCache = {
      center,
      radius,
      supportBlockSet,
      nextSpawnTick: currentTick,
    };

    this.runtimeBySpawnerKey.set(key, runtime);
    return runtime;
  }

  private computeCenter(a: Vector3, b: Vector3): Vector3 {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
  }

  private computeRadius(center: Vector3, a: Vector3, b: Vector3): number {
    const dx = Math.max(Math.abs(a.x - center.x), Math.abs(b.x - center.x));
    const dy = Math.max(Math.abs(a.y - center.y), Math.abs(b.y - center.y));
    const dz = Math.max(Math.abs(a.z - center.z), Math.abs(b.z - center.z));
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private handleSelectionUi() {
    for (const player of this.plugin.world.getPlayers()) {
      const state = this.selectionModeByPlayerId.get(player.id);
      if (!state) continue;

      if (state.completed) {
        system.run(() => PlayerUtils.stopBottomBar(player));
        continue;
      }

      const startText = state.start
        ? this.plugin.mcColors(
          `(${state.start.x}, ${state.start.y}, ${state.start.z})`,
        ).green
        : this.plugin.mcColors("ยังไม่เลือก").red;

      const endText = state.end
        ? this.plugin.mcColors(
          `(${state.end.x}, ${state.end.y}, ${state.end.z})`,
        ).green
        : this.plugin.mcColors("ยังไม่เลือก").red;

      PlayerUtils.sendBottomBar(
        player,
        `เลือกพื้นที่สำหรับสร้างระบบสร้างพืชใหม่\n` +
          `เริ่มต้น: ${startText}\n` +
          `สิ้นสุด: ${endText}\n` +
          `ย่อเพื่อยกเลิก`,
      );
    }
  }

  public showCropSpawnerSettings(player: Player): void {
    const ui = IActionForm.createForm(
      "การตั้งค่าขั้นสูง",
      "ตั้งค่าตัวเลือกขั้นสูงสำหรับระบบฟาร์ม",
    );
    ui.addDivider();
    ui.addButton(this.plugin.mcColors("ปิด").red, "textures/ui/realms_red_x");
    ui.addButton(
      this.plugin.mcColors("จำนวนระบบสร้างพืชทั้งหมด").blackGray + " : " +
        this.plugin.mcColors(`${this.dataManager.size}`).red,
    );
    ui.addButton(
      this.plugin.mcColors("สร้างระบบสร้างพืชใหม่").blackGray,
      "textures/ui/color_plus",
      () => {
        this.showAddCropSpawnerMenu(player);
      },
    );
    ui.addDivider();

    for (const [key, data] of Object.entries(this.dataManager.data)) {
      const cropInfo = this.cropManager.getCropOptions(data.cropId);
      if (!cropInfo) {
        ui.addButton(
          `${data.cropId} - ${this.plugin.mcColors("ไม่พบข้อมูลพืชนี้").red}`,
        );
        continue;
      }

      const start =
        `${data.rangeLocation.start.x},${data.rangeLocation.start.y},${data.rangeLocation.start.z}`;
      const end =
        `${data.rangeLocation.end.x},${data.rangeLocation.end.y},${data.rangeLocation.end.z}`;

      ui.addButton(
        `${cropInfo.name} - ${this.plugin.mcColors(data.cropId).blackGray}\n` +
          `${this.plugin.mcColors(start).blackGray} | ${
            this.plugin.mcColors(end).darkRed
          }`,
        cropInfo.icon,
        () => this.showCropActionsMenu(player, data, key),
      );
    }

    ui.show(player);
  }

  private showCropActionsMenu(
    player: Player,
    data: CropSpawnerData,
    key: string,
  ): void {
    const cropInfo = this.cropManager.getCropOptions(data.cropId);

    const ui = IActionForm.createForm(
      "การจัดการระบบสร้างพืช",
      "จัดการระบบสร้างพืชที่เลือก",
    );
    ui.addDivider();
    ui.addButton(
      this.plugin.mcColors("ย้อนกลับ").blackGray,
      "",
      () => this.showCropSpawnerSettings(player),
    );
    ui.addDivider();

    if (!cropInfo) {
      ui.addButton(this.plugin.mcColors("ไม่พบข้อมูลพืชนี้").red);
      ui.show(player);
      return;
    }

    ui.addButton(
      this.plugin.mcColors("แก้ไขระบบสร้างพืช").blackGray,
      "textures/ui/book_edit_default",
      () => {
        this.showAddCropSpawnerMenu(player, { data, key });
      },
    );

    ui.addButton(
      this.plugin.mcColors("ลบระบบสร้างพืช").blackGray,
      "textures/ui/icon_trash",
      () => {
        this.dataManager.removeCropData(key);
        this.runtimeBySpawnerKey.delete(key);
        PlayerUtils.sendToast(player, "", "ลบระบบสร้างพืชสำเร็จ!");
        this.showCropSpawnerSettings(player);
      },
    );

    ui.show(player);
  }

  private showAddCropSpawnerMenu(
    player: Player,
    edit?: { data: CropSpawnerData; key: string },
  ): void {
    const ui = IModalForm.createForm("สร้างระบบสร้างพืชใหม่", "เริ่มสร้าง");

    const cropOptions = [...this.cropManager.getCropsData.entries()].map((
      [type, value],
    ) => ({
      ...value,
      type,
    }));

    ui.addDivider();

    ui.addDropdown(
      {
        label: "เลือกประเภทพืช",
        options: cropOptions.map((c) => `${c.name} (${c.type})`),
        defaultValueIndex: edit
          ? cropOptions.findIndex((c) => c.type === edit.data.cropId)
          : 0,
      },
      () => {},
    );

    ui.addTextField(
      {
        label: "ระยะเวลาการสร้างพืช (วินาที)",
        placeholderText: "ตัวอย่าง: 60",
        defaultValue: edit ? (edit.data.spawnInterval / 20).toString() : "60",
      },
      () => {},
    );

    ui.addTextField(
      {
        label: "จำนวนพืชสูงสุดในพื้นที่",
        placeholderText: "ตัวอย่าง: 10",
        defaultValue: edit ? edit.data.maxCrops.toString() : "10",
      },
      () => {},
    );

    if (edit) {
      ui.addToggle({ label: "เเก้ไขพื้นที่", defaultValue: false }, () => {});
    }

    ui.show(player).then(async (res) => {
      if (!res || res.canceled || !res.formValues) return;

      const [, selectedIndex, intervalText, maxText, editAreaToggle] =
        res.formValues;

      const selectedCrop = cropOptions[selectedIndex as number];
      if (!selectedCrop) {
        PlayerUtils.sendToast(player, "", "กรุณาเลือกพืชที่ถูกต้อง");
        this.showAddCropSpawnerMenu(player, edit);
        return;
      }

      const spawnIntervalTicks = parseInt(intervalText as string) * 20;
      const maxCrops = parseInt(maxText as string);
      const mustPickNewArea = edit ? Boolean(editAreaToggle) : true;

      if (
        isNaN(spawnIntervalTicks) || isNaN(maxCrops) ||
        spawnIntervalTicks <= 0 || maxCrops <= 0
      ) {
        PlayerUtils.sendToast(
          player,
          "",
          "กรอกข้อมูลไม่ถูกต้องในเมนูสร้างระบบสร้างพืชใหม่",
        );
        this.showAddCropSpawnerMenu(player, edit);
        return;
      }

      if (mustPickNewArea) {
        PlayerUtils.sendToast(player, "", "กรุณาเลือกพื้นที่สำหรับสร้างระบบสร้างพืชใหม่");
        this.selectionModeByPlayerId.set(player.id, {
          start: null,
          end: null,
          completed: false,
        });
        await this.waitUntil(() =>
          this.selectionModeByPlayerId.get(player.id)?.completed === true
        );
        PlayerUtils.stopBottomBar(player);
      } else if (edit) {
        this.selectionModeByPlayerId.set(player.id, {
          start: edit.data.rangeLocation.start,
          end: edit.data.rangeLocation.end,
          completed: true,
        });
        PlayerUtils.stopBottomBar(player);
      }

      const selection = this.selectionModeByPlayerId.get(player.id);
      this.selectionModeByPlayerId.delete(player.id);
      PlayerUtils.stopBottomBar(player);

      if (!selection?.start || !selection?.end) {
        PlayerUtils.sendToast(player, "", "ยกเลิกการสร้างระบบสร้างพืชใหม่");
        return;
      }

      const newData: CropSpawnerData = {
        cropId: selectedCrop.type,
        rangeLocation: { start: selection.start, end: selection.end },
        spawnInterval: spawnIntervalTicks,
        maxCrops,
      };

      if (edit) {
        this.dataManager.setCropData(edit.key, newData);
        this.runtimeBySpawnerKey.delete(edit.key);
      } else {
        this.dataManager.addCropData(newData);
      }

      PlayerUtils.sendToast(
        player,
        "",
        edit ? "แก้ไขระบบสร้างพืชสำเร็จ!" : "สร้างระบบสร้างพืชใหม่สำเร็จ!",
        selectedCrop.icon,
      );
    });
  }

  private waitUntil(predicate: () => boolean): Promise<void> {
    return new Promise((resolve) => {
      const runId = this.plugin.system.runInterval(() => {
        if (!predicate()) return;
        this.plugin.system.clearRun(runId);
        resolve();
      }, 20);
    });
  }
}

export { CropSpawner };
