// ─── MobStacker › index ───────────────────────────────────────────────────────

import {
  EntityDieAfterEvent,
  EntityRemoveBeforeEvent,
  PlayerInteractWithEntityBeforeEvent,
  ShutdownEvent,
  StartupEvent,
  system,
} from "@minecraft/server";
import { EventHandlers, PluginBase, SystemBase, WorldEvents } from "@axeth/api";
import { DynamicPropertyStorageAdapter } from "../../api/adapters/DynamicPropertyStorageAdapter.ts";
import { MobStackingAdapter } from "./adapter/MobStackingAdapter.ts";
import { getCfgArr, getCfgNum, getCfgStr } from "./config/helpers.ts";
import { onEntityDie } from "./handlers/onEntityDie.ts";
import { onEntityInteract } from "./handlers/onEntityInteract.ts";
import { onXpDrop } from "./handlers/onXpDrop.ts";
import { onEntitySpawn } from "./handlers/onEntitySpawn.ts";
import { startStackingLoop, MobStackingJobStats } from "./jobs/stackingJob.ts";
import { startJobDebugLoop } from "../JobDebug/index.ts";
import { showMobStackingSettings } from "./ui/StackingSettingsMenu.ts";

export class MobStackerPlugin extends PluginBase {
  public override name = "MobStacker";
  public override version = "3.0.0";
  public override icon = "textures/items/spawn_egg";

  private storage!: DynamicPropertyStorageAdapter;
  private adapter!: MobStackingAdapter;

  private readonly xpQueue = new Map<string, number>();
  private readonly resetEntities = new Set<string>();
  private jobRunning = false;
  readonly jobStats: MobStackingJobStats = {
    lastPassMs: 0,
    entitiesScanned: 0,
    entitiesMerged: 0,
    lastPassTick: 0,
  };

  constructor(events: EventHandlers<WorldEvents>, systemBase: SystemBase) {
    super(events, systemBase);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  public override onLoad(): void {
    this.storage = new DynamicPropertyStorageAdapter("StackingAmount");
    this.adapter = new MobStackingAdapter(
      this.storage,
      () => getCfgArr(this, "StackMob"),
      () => getCfgNum(this, "RadiusStacking", 10),
      this.resetEntities,
    );

    this.events.on(
      "AfterEntityDie",
      (ev: EntityDieAfterEvent) =>
        onEntityDie(ev, {
          storage: this.storage,
          plugin: this,
          xpQueue: this.xpQueue,
        }),
    );
    this.events.on(
      "BeforePlayerInteractWithEntity",
      (ev: PlayerInteractWithEntityBeforeEvent) =>
        onEntityInteract(ev, {
          storage: this.storage,
          plugin: this,
          resetEntities: this.resetEntities,
        }),
    );
    this.events.on(
      "BeforeEntityRemove",
      (ev: EntityRemoveBeforeEvent) =>
        onXpDrop(ev, {
          xpQueue: this.xpQueue,
        }),
    );
    this.events.on(
      "AfterEntitySpawn",
      (ev) =>
        onEntitySpawn(ev, {
          storage: this.storage,
          plugin: this,
        }),
    );
  }

  public override onEnable(_ev: StartupEvent): void {
    system.run(() => {
      if (!this.isEnabled()) return;
      if (this.jobRunning) return;
      this.jobRunning = true;

      const stackingCtx = {
        isRunning: () => this.jobRunning,
        plugin: this,
        getStorage: () => this.storage,
        getAdapter: () => this.adapter,
        resetEntities: this.resetEntities,
        jobStats: this.jobStats,
      };

      startStackingLoop(stackingCtx);

      // Actionbar debug: /tag @s add jobdebug to enable overlay.
      startJobDebugLoop({
        isRunning: () => this.jobRunning,
        getItemStats: () => {
          const plugins = this.systemBase.pluginManagers.getPlugins();
          const item = plugins.find((p) => p.name === "ItemStacker");
          return item
            ? (item as {
              getStats?: () => { trackedItems: number; pendingItems: number };
            }).getStats?.() ?? null
            : null;
        },
        getMobStats: () => ({
          ...this.jobStats,
          scanned: this.jobStats.entitiesScanned,
          merged: this.jobStats.entitiesMerged,
        }),
      });
    });

    this.logger.info("MobStacker enabled.");
  }

  public override onDisable(_ev: ShutdownEvent): void {
    this.jobRunning = false;
    this.xpQueue.clear();
    this.resetEntities.clear();
    this.logger.info("MobStacker disabled.");
  }

  // ─── Metrics ────────────────────────────────────────────────────────────────

  public getStats() {
    return {
      xpQueueSize: this.xpQueue.size,
      resetEntitiesSize: this.resetEntities.size,
      stackMobListSize: getCfgArr(this, "StackMob").length,
      radiusStacking: getCfgNum(this, "RadiusStacking", 10),
      mobDeathMode: getCfgStr(this, "MobDeathMode", "All"),
      jobLastPassMs: this.jobStats.lastPassMs,
      jobScanned: this.jobStats.entitiesScanned,
      jobMerged: this.jobStats.entitiesMerged,
    };
  }

  /** Clears all in-memory tracking data. */
  public clearData(): void {
    this.xpQueue.clear();
    this.resetEntities.clear();
    this.logger.info("MobStacker data cleared.");
  }

  // ─── Settings ───────────────────────────────────────────────────────────────

  public override getAdvancedSettings(pl: never, _plugin: never, onBack: () => void): (() => void) | null {
    return () => {
      showMobStackingSettings(pl as never, this, onBack);
    };
  }

  public override getSettings() {
    return {
      Enabled: {
        description: "Toggle MobStacker on or off",
        type: "boolean" as const,
        default: true,
      },
      StackMob: {
        description:
          "Comma-separated mob type-IDs to stack (e.g. minecraft:pig,minecraft:cow)",
        type: "string" as const,
        default:
          "minecraft:pig,minecraft:cow,minecraft:sheep,minecraft:chicken",
        canUserModify: false,
      },
      RadiusStacking: {
        description: "Radius (blocks) where mobs are merged",
        type: "number" as const,
        default: 10,
        maxValue: 100,
      },
      MobDeathMode: {
        description:
          "All = drop loot for all stacked mobs, Only one = drop once",
        type: "array" as const,
        default: ["All", "Only one"],
      },
      DisplayText: {
        description: "Name-tag format. Tokens: %a=amount %n=name",
        type: "string" as const,
        default: " §7§c§l%a §r%n§r",
      },
      MassBreeding: {
        description: "Enable feeding stacked mobs to breed them all at once",
        type: "boolean" as const,
        default: true,
      },
    };
  }
}
