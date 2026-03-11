import { IActionForm, PluginBase, type PluginSettingOptions } from "@axeth/api";
import { FarmCropManagers } from "./class/FarmCropManagers.ts";
import {
  Block,
  BlockComponentPlayerBreakEvent,
  type BlockCustomComponent,
  Entity,
  EquipmentSlot,
  GameMode,
  ItemStack,
  Player,
  StartupEvent,
} from "@minecraft/server";
import { CropSpawner } from "./class/CropSpawner.ts";
import { CollectType } from "./types/CropOptions.ts";

type RandomDropItem = {
  change: number;
  callback: (player: Player, block: Block) => void;
};

class RandomItem {
  constructor(
    private readonly items: RandomDropItem[],
    private readonly target: Player,
    private readonly block: Block,
  ) {}

  get() {
    const totalWeight = this.items.reduce((acc, item) => acc + item.change, 0);
    if (totalWeight <= 0) return;

    const random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    for (const item of this.items) {
      cumulativeWeight += item.change;
      if (random < cumulativeWeight) {
        item.callback(this.target, this.block);
        return;
      }
    }
  }
}

class RandomOre implements BlockCustomComponent {
  private readonly drops: Array<{ typeId: string; change: number }> = [
    { typeId: "minecraft:raw_gold", change: 20 },
    { typeId: "minecraft:raw_iron", change: 35 },
    { typeId: "minecraft:coal", change: 25 },
    { typeId: "minecraft:diamond", change: 10 },
    { typeId: "minecraft:emerald", change: 10 },
  ];

  onPlayerBreak(ev: BlockComponentPlayerBreakEvent) {
    const pl = ev.player;
    if (!pl) return;

    const block = ev.block;
    if (pl.getGameMode() === GameMode.Creative) return;

    const mainHand = pl.getComponent("equippable")?.getEquipment(
      EquipmentSlot.Mainhand,
    );
    const isPickaxe = mainHand?.getTags().includes("minecraft:is_pickaxe") ??
      false;

    if (isPickaxe) {
      const dropItem = new RandomItem(
        this.drops.map((drop) => ({
          change: drop.change,
          callback: (_player, targetBlock) => {
            targetBlock.dimension.spawnItem(
              new ItemStack(drop.typeId, 1),
              targetBlock.center(),
            );
          },
        })),
        pl,
        block,
      );
      dropItem.get();
      pl.playSound("random.orb");
      return;
    }

    pl.playSound("mob.villager.no");
    pl.onScreenDisplay.setActionBar(
      "\xA7cPlease use pickaxe to destroy\xA7r",
    );
    ev.block.setPermutation(ev.brokenBlockPermutation);
  }
}

class FarmSystem extends PluginBase {
  public override name: string = "FarmPlugin";
  public override version: string = "1.0.0";
  public override icon: string = "textures/items/tools/iron_sickle";

  private farmCropManager!: FarmCropManagers;
  private cropSpawner!: CropSpawner;

  public override onEnable(ev: StartupEvent): void | Promise<void> {
    ev.blockComponentRegistry.registerCustomComponent(
      "kisu:random_ore_component",
      new RandomOre(),
    );
  }

  public override onLoad(): void {
    this.farmCropManager = FarmCropManagers.initialize(this);
    this.farmCropManager.registerCropType("kisu:lettuce", {
      type: "kisu:lettuce",
      collectType: CollectType.Cursor,
      expireTicks: 70,
      growthTime: 100,
      yieldAmount: 3,
      collectDuration: 40,
      name: "ผักกาด",
      icon: "textures/items/crops/lettuce",
      tool: [
        {
          type: "kisu:iron_sickle",
          texture: "textures/items/tools/iron_sickle",
          name: "เคียว",
        },
      ],
      loot: [
        { type: "kisu:lettuce", amount: { min: 1, max: 5 } },
      ],
    });
    this.farmCropManager.registerCropType("kisu:banana", {
      type: "kisu:banana",
      collectType: CollectType.RepeatHit,
      expireTicks: 70,
      growthTime: 100,
      yieldAmount: 3,
      collectDuration: 40,
      name: "กล้วย",
      icon: "textures/items/crops/banana",
      tool: [
        {
          type: "kisu:iron_sickle",
          texture: "textures/items/tools/iron_sickle",
          name: "เคียว",
        },
      ],
      loot: [
        { type: "kisu:banana", amount: { min: 1, max: 5 } },
      ],
    });
    this.farmCropManager.registerCropType("kisu:basil", {
      type: "kisu:basil",
      collectType: CollectType.Cursor,
      expireTicks: 70,
      growthTime: 100,
      yieldAmount: 3,
      collectDuration: 40,
      name: "โหระพา",
      icon: "textures/items/crops/basil",
      tool: [
        {
          type: "kisu:iron_sickle",
          texture: "textures/items/tools/iron_sickle",
          name: "เคียว",
        },
      ],
      loot: [
        { type: "kisu:basil", amount: { min: 1, max: 5 } },
      ],
    });
    this.farmCropManager.registerCropType("kisu:broccoli", {
      type: "kisu:broccoli",
      collectType: CollectType.Cursor,
      expireTicks: 70,
      growthTime: 100,
      yieldAmount: 3,
      collectDuration: 40,
      name: "บรอกโคลี",
      icon: "textures/items/crops/broccoli",
      tool: [
        {
          type: "kisu:iron_sickle",
          texture: "textures/items/tools/iron_sickle",
          name: "เคียว",
        },
      ],
      loot: [
        { type: "kisu:broccoli", amount: { min: 1, max: 5 } },
      ],
    });
    this.farmCropManager.registerCropType("kisu:cabbage", {
      type: "kisu:cabbage",
      collectType: CollectType.Cursor,
      expireTicks: 70,
      growthTime: 100,
      yieldAmount: 3,
      collectDuration: 40,
      name: "กะหล่ำปลี",
      icon: "textures/items/crops/cabbage",
      tool: [
        {
          type: "kisu:iron_sickle",
          texture: "textures/items/tools/iron_sickle",
          name: "เคียว",
        },
      ],
      loot: [
        { type: "kisu:cabbage", amount: { min: 1, max: 5 } },
      ],
    });
    this.farmCropManager.registerCropType("kisu:cassava", {
      type: "kisu:cassava",
      collectType: CollectType.RepeatHit,
      expireTicks: 70,
      growthTime: 100,
      yieldAmount: 1,
      collectDuration: 40,
      name: "มัน",
      icon: "textures/items/crops/cassava",
      tool: [
        {
          type: "kisu:shovel",
          texture: "textures/items/tools/shovel",
          name: "พลั่วขุด",
        },
      ],
      loot: [
        { type: "kisu:cassava", amount: { min: 1, max: 5 } },
      ],
    });
    this.farmCropManager.registerCropType("kisu:corn", {
      type: "kisu:corn",
      collectType: CollectType.Cursor,
      expireTicks: 70,
      growthTime: 100,
      yieldAmount: 3,
      collectDuration: 40,
      name: "ข้าวโพด",
      icon: "textures/items/crops/corn",
      tool: [
        {
          type: "kisu:iron_sickle",
          texture: "textures/items/tools/iron_sickle",
          name: "เคียว",
        },
      ],
      loot: [
        { type: "kisu:corn", amount: { min: 1, max: 5 } },
      ],
    });
    this.farmCropManager.registerCropType("kisu:onion", {
      type: "kisu:onion",
      collectType: CollectType.Cursor,
      expireTicks: 70,
      growthTime: 100,
      yieldAmount: 3,
      collectDuration: 40,
      name: "หอมเเดง",
      icon: "textures/items/crops/onion",
      tool: [
        {
          type: "kisu:iron_sickle",
          texture: "textures/items/tools/iron_sickle",
          name: "เคียว",
        },
      ],
      loot: [
        { type: "kisu:onion", amount: { min: 1, max: 5 } },
      ],
    });

    this.cropSpawner = CropSpawner.initialize(this, this.farmCropManager);

    //Events
    this.onHitFarm();
    this.onInteractFarm();
  }

  public override getAdvancedSettings(pl: Player): (() => void) | null {
    return () => {
      this.cropSpawner.showCropSpawnerSettings(pl);
    };
  }

  public override getSettings(): PluginSettingOptions {
    return {
      farmCropsData: {
        canUserModify: false,
        default: "{}",
        type: "string",
        description: "Data for all farm crops in the server.",
      },
    };
  }

  public onInteractFarm() {
    this.events.on("BeforePlayerInteractWithEntity", async (ev) => {
      const farmTarget = ev.target;
      const player = ev.player;

      await this.system.waitTicks(1);

      if (!farmTarget || !player) return;
      if (!(player instanceof Player)) return;
      if (!player.isSneaking) return;
      const crop = this.farmCropManager.getCrops(farmTarget);
      if (!crop) return;
      this.showTutorial(farmTarget, player);
    });
  }

  private showTutorial(farmTarget: Entity, player: Player) {
    const crop = this.farmCropManager.getCrops(farmTarget);
    if (!crop) return;
    const cropOptions = this.farmCropManager.getCropOptions(farmTarget.typeId);
    if (!cropOptions) return;
    const tutorial = IActionForm.createForm("§a§c§t§i§o§n§r§fวิธีการเก็บเกี่ยว");
    tutorial.addLabel(
      ` §fวิธีการเก็บเกี่ยว §a${cropOptions.name}§r§f:` + `\n` +
        `   1. ใช้${
          cropOptions.tool && cropOptions.tool.length > 0
            ? cropOptions.tool.map((t) => t.name).join(" หรือ ")
            : "มือเปล่า"
        }` + `\n` +
        `   2. ${
          cropOptions.collectType === CollectType.Cursor
            ? "เล็งเป้ากลางจอไปที่จุดเคอร์เซอร์เเล้วกดตีที่ผัก"
            : "กดตีที่พืชรัวๆ"
        } เพื่อเก็บเกี่ยว` + `\n\n`,
    );
    tutorial.addButton("  เข้าใจเเล้ว", "", () => {});
    tutorial.show(player);
  }

  public onHitFarm() {
    this.events.on("AfterEntityHitEntity", async (ev) => {
      const farmTarget = ev.hitEntity;
      const player = ev.damagingEntity;

      if (!farmTarget || !player) return;
      if (!(player instanceof Player)) return;

      const crop = this.farmCropManager.getCrops(farmTarget);
      //is first hit
      if (player.hasTag(`tutorial_farm_hit:${farmTarget.typeId}`) === false) {
        this.showTutorial(farmTarget, player);
        player.addTag(`tutorial_farm_hit:${farmTarget.typeId}`);
      }
      if (!crop) return;
      await crop.harvest(player);
    });
  }
}

export { FarmSystem };
