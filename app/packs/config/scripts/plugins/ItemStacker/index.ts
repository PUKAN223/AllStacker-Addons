// ─── ItemStackerPlugin ────────────────────────────────────────────────────────
//
// Lifecycle entry-point only.
// All business logic lives in dedicated modules:
//
//   types.ts              → StackEntry, ItemSnapshot
//   config.ts             → getCfg* helpers, ConfigProvider
//   utils.ts              → itemEntityName, getTimeRemaining, getSizeStack, findEntityById
//   combineItemStack.ts   → merge/combine logic
//   ItemStackingAdapter.ts → canStack, merge, deStack, split
//   jobs/stackingJob.ts   → stacking loop (normal + fast-mode)
//   jobs/seeingJob.ts     → name-tag / expiry loop
//   handlers/onItemSpawned.ts → spawn event handler
//   handlers/onItemRemoved.ts → remove event handler
// ─────────────────────────────────────────────────────────────────────────────

import {
  CommandPermissionLevel,
  CustomCommandStatus,
  Entity,
  EntityRemoveBeforeEvent,
  EntitySpawnAfterEvent,
  ShutdownEvent,
  StartupEvent,
  system,
  world,
} from "@minecraft/server";
import {
  EventHandlers,
  JsonDatabase,
  PluginBase,
  SystemBase,
  WorldEvents,
} from "@axeth/api";
import { DynamicPropertyStorageAdapter } from "../../api/adapters/DynamicPropertyStorageAdapter.ts";
import { NameTagRenderingAdapter } from "../../api/adapters/NameTagRenderingAdapter.ts";
import { ItemStackingAdapter } from "./adapter/ItemStackingAdapter.ts";
import { combineItemStack } from "./functions/combineItemStack.ts";
import {
  getCfgArr,
  getCfgBool,
  getCfgNum,
  getCfgStr,
} from "./config/helpers.ts";
import { onItemSpawned } from "./handlers/onItemSpawned.ts";
import { onItemRemoved } from "./handlers/onItemRemoved.ts";
import { runFastModeLoop, startStackingLoop } from "./jobs/stackingJob.ts";
import { startSeeingLoop } from "./jobs/seeingJob.ts";
import { showItemStackingSettings } from "./ui/StackingSettingsMenu.ts";
import type { StackEntry } from "./types/StackEntry.ts";

export type { StackEntry };

// ─────────────────────────────────────────────────────────────────────────────

export class ItemStackerPlugin extends PluginBase {
  public override name = "ItemStacker";
  public override version = "3.0.0";
  public override icon = "textures/items/diamond";

  private storage!: DynamicPropertyStorageAdapter;
  private rendering!: NameTagRenderingAdapter;
  private adapter!: ItemStackingAdapter;

  /** Persists logical totals across /reload (JsonDatabase → world dynamic property). */
  private stackData!: Map<string, StackEntry>;
  /** Temporary backup for items crossing dimension boundaries. */
  private dimensionBackup!: Map<string, StackEntry>;

  private readonly pendingStack = new Map<string, Entity>();
  private jobRunning = false;

  constructor(events: EventHandlers<WorldEvents>, systemBase: SystemBase) {
    super(events, systemBase);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  public override onLoad(): void {
    this.storage = new DynamicPropertyStorageAdapter("ItemStackAmount");
    this.stackData = new JsonDatabase("ItemStackData", world) as unknown as Map<
      string,
      StackEntry
    >;
    this.dimensionBackup = new JsonDatabase(
      "DimensionDataBackup",
      world,
    ) as unknown as Map<string, StackEntry>;
    this.rendering = new NameTagRenderingAdapter(
      getCfgStr(this, "DisplayText", "§7§c§l%a §r%n§r"),
    );
    this.adapter = new ItemStackingAdapter(
      this.storage,
      () => getCfgArr(this, "UnStackList"),
      () => 15, // RadiusCombine is read inside combineItemStack via getCfgNum
    );

    this.events.on(
      "AfterEntitySpawn",
      (ev: EntitySpawnAfterEvent) =>
        onItemSpawned(ev, {
          pendingStack: this.pendingStack,
          stackData: this.stackData,
        }),
    );

    this.events.on(
      "BeforeEntityRemove",
      (ev: EntityRemoveBeforeEvent) =>
        onItemRemoved(ev, {
          pendingStack: this.pendingStack,
          stackData: this.stackData,
          dimensionBackup: this.dimensionBackup,
          adapter: this.adapter,
          rendering: this.rendering,
        }),
    );
  }

  public override onEnable(ev: StartupEvent): void {
    ev.customCommandRegistry.registerCommand(
      {
        name: "kisu:kill-items",
        description: "Kill and clear all stacked items.",
        permissionLevel: CommandPermissionLevel.Admin,
        cheatsRequired: false,
      },
      (_origin) => {
        let count = 0;
        this.clearData(); // Clear data first so onItemRemoved doesn't destack
        for (const dimId of ["overworld", "nether", "the_end"] as const) {
          try {
            const dim = world.getDimension(dimId);
            const items = dim.getEntities({ type: "minecraft:item" });
            for (const item of items) {
              if (item.isValid) {
                system.run(() => {
                  item.addTag("fakeItem");
                  item.remove();
                });
                count++;
              }
            }
          } catch { /* ignore unloaded dims */ }
        }
        return {
          message:
            `[ItemStacker] Successfully killed and cleared ${count} items.`,
          status: CustomCommandStatus.Success,
        };
      },
    );

    system.run(() => {
      if (!this.isEnabled()) return;
      if (this.jobRunning) return;
      this.jobRunning = true;

      const stackingCtx = {
        isRunning: () => this.jobRunning,
        getPendingStack: () => this.pendingStack as Map<string, Entity>,
        getStackData: () =>
          this.stackData as Map<string, StackEntry> | undefined,
        combineItemStack: (en: Parameters<typeof combineItemStack>[0]) =>
          combineItemStack(
            en,
            this.storage,
            this.stackData,
            this.pendingStack,
            this.adapter,
            this,
          ),
      };

      const seeingCtx = {
        isRunning: () => this.jobRunning,
        getStackData: () =>
          this.stackData as Map<string, StackEntry> | undefined,
        getRendering: () => this.rendering,
        plugin: this,
      };

      if (getCfgBool(this, "FastMode", false)) {
        runFastModeLoop(stackingCtx);
      } else {
        startStackingLoop(stackingCtx);
      }

      startSeeingLoop(seeingCtx);
    });

    this.logger.info("ItemStacker enabled.");
  }

  public override onDisable(_ev: ShutdownEvent): void {
    this.jobRunning = false;
    // Do NOT clear stackData — it persists logical totals across /reload.
    this.pendingStack.clear();
    this.logger.info("ItemStacker disabled.");
  }

  // ─── Metrics ────────────────────────────────────────────────────────────────

  public getStats() {
    return {
      trackedItems: this.stackData?.size ?? 0,
      pendingItems: this.pendingStack?.size ?? 0,
      fastMode: getCfgBool(this, "FastMode", false),
      radiusCombine: getCfgNum(this, "RadiusCombine", 15),
      radiusSeeing: getCfgNum(this, "RadiusSeeing", 10),
      unstackListSize: getCfgArr(this, "UnStackList").length,
    };
  }

  /** Clears all in-memory and persisted stacking data. */
  public clearData(): void {
    this.stackData?.clear();
    this.dimensionBackup?.clear();
    this.pendingStack.clear();
    this.logger.info("ItemStacker data cleared.");
  }

  // ─── Settings ───────────────────────────────────────────────────────────────

  public override getAdvancedSettings(
    pl: never,
    _plugin: never,
    onBack: () => void,
  ): (() => void) | null {
    return () => {
      showItemStackingSettings(pl as never, this, onBack);
    };
  }

  public override getSettings() {
    return {
      Enabled: {
        description: "Toggle ItemStacker on or off",
        type: "boolean" as const,
        default: true,
      },
      FastMode: {
        description: "Run stacking every tick instead of co-operative job",
        type: "boolean" as const,
        default: false,
      },
      RadiusSeeing: {
        description:
          "Radius (blocks) where item name-tags are shown to players",
        type: "number" as const,
        default: 10,
        maxValue: 50,
      },
      RadiusCombine: {
        description: "Radius (blocks) within which identical items are merged",
        type: "number" as const,
        default: 15,
        maxValue: 50,
      },
      DisplayText: {
        description:
          "Name-tag format. Tokens: %a=amount %n=name %m=min %s=sec %l=new line",
        type: "string" as const,
        default: " §7§c§l%a §r%n§r",
      },
      UnStackList: {
        description:
          "Comma-separated item type-IDs to never stack (e.g. minecraft:bow)",
        type: "string" as const,
        default: "",
        canUserModify: false,
      },
    };
  }
}
