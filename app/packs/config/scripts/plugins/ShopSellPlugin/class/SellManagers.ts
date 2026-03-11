import { IActionForm, IModalForm, PlayerUtils, PluginBase } from "@axeth/api";
import {
  Dimension,
  Entity,
  EntityInventoryComponent,
  Player,
  system,
  type Vector3,
} from "@minecraft/server";
import { type MarketNPCData, TransactionType } from "../types/MarketData.ts";
import { MarketDataManagers } from "../class/MarketDataManagers.ts";
import { MarketManager } from "../class/MarketManager.ts";

type BarKey = "start" | "middle" | "end";

class SellManagers {
  private readonly plugin: PluginBase;
  private readonly marketDataManagers: MarketDataManagers;
  private readonly marketManagers: MarketManager;

  private static readonly SELL_NPC_TAG = "sell_npc";
  private static readonly PRICE_RATE = 0.91;

  private readonly BAR: Record<BarKey, string[]> = {
    start: ["", "", "", "", ""],
    middle: ["", "", "", "", ""],
    end: ["", "", "", "", ""],
  };

  private constructor(plugin: PluginBase, marketManagers: MarketManager) {
    this.plugin = plugin;
    this.marketManagers = marketManagers;
    this.marketDataManagers = new MarketDataManagers(plugin);
  }

  public static initialize(plugin: PluginBase, marketManagers: MarketManager) {
    return new SellManagers(plugin, marketManagers);
  }

  private get data(): MarketNPCData {
    const raw = this.plugin.config.get()?.["marketData"]?.value;
    if (typeof raw !== "string") return {} as MarketNPCData;
    try {
      return JSON.parse(raw) as MarketNPCData;
    } catch {
      return {} as MarketNPCData;
    }
  }

  private set data(next: MarketNPCData) {
    const cfg = this.plugin.config.get();
    cfg["marketData"]!.value = JSON.stringify(next);
    this.plugin.config.set(cfg);
  }

  private get size() {
    return Object.keys(this.data).length;
  }

  public spawnSellNpc(sellId: string, position: Vector3, dimension: Dimension) {
    const info = this.data[sellId];
    if (!info) return;

    dimension.runCommand(
      `summon npc "${info.config.name}" ${position.x} ${position.y} ${position.z}`,
    );

    const npc = dimension.getEntities({
      type: "minecraft:npc",
      location: position,
      maxDistance: 2,
    })[0];

    if (!npc) return;

    npc.addTag(SellManagers.SELL_NPC_TAG);
    npc.addTag(`sell_setup:${sellId}`);
  }

  public isSellNpc(npc: Entity) {
    return npc.hasTag(SellManagers.SELL_NPC_TAG);
  }

  public isHasSell(sellId: string) {
    return sellId in this.data;
  }

  public showSellAdvancedSettings(pl: Player) {
    const form = IActionForm.createForm(
      "การตั้งค่าขั้นสูง",
      "ตั้งค่าตัวเลือกขั้นสูงสำหรับปลั๊กอินร้านค้าขายของ",
    );

    form.addDivider();
    form.addButton(this.plugin.mcColors("ปิด").red, "textures/ui/realms_red_x");
    form.addButton(
      this.plugin.mcColors("รายการ NPC ขายของ").blackGray +
        " : " +
        this.plugin.mcColors(String(this.size)).red,
    );

    const d = this.data;
    Object.keys(d).forEach((sellId) => {
      const info = d[sellId];
      if (!info) return;
      form.addButton(
        this.plugin.mcColors(info.config.name).yellow +
          this.plugin.mcColors(` [ ${sellId} ]`).blackGray,
        "textures/ui/sidebar_icons/marketplace",
        () => this.showActionSellMenu(pl, sellId),
      );
    });

    form.show(pl);
  }

  private showActionSellMenu(pl: Player, sellId: string) {
    const d = this.data;
    const sellInfo = d[sellId];
    if (!sellInfo) return;

    const scoreboard = this.plugin.world.scoreboard;
    const scoreboardList = scoreboard.getObjectives().map((obj) => obj.id);
    const currentScoreboardIndex = Math.max(
      0,
      scoreboardList.indexOf(sellInfo.config.scoreboard),
    );

    const form = IActionForm.createForm(
      `${sellInfo.config.name} การกระทำ`,
      "เลือกการกระทำที่ต้องการดำเนินการ",
    );

    form.addDivider();
    form.addButton("สร้าง NPC ขายของ", "textures/items/spawn_egg", () => {
      this.spawnSellNpc(sellId, pl.location, pl.dimension);
      PlayerUtils.sendToast(
        pl,
        "",
        `${sellInfo.config.name} Spawned!`,
        "textures/ui/sidebar_icons/marketplace",
      );
    });

    form.addDivider();
    form.addLabel(this.plugin.mcColors("การกระทำ:").grey);

    form.addButton("แก้ไข", "textures/ui/book_edit_default", () => {
      const edit = IModalForm.createForm(
        `§m§n§rแก้ไข ${sellInfo.config.name}`,
        this.plugin.mcColors("แก้ไข").white,
      );

      edit.addLabel("\n              กรอนข้อมูลร้านค้าใหม่ของคุณด้านล่าง");
      edit.addLabel("");

      edit.addTextField(
        {
          label: "ชื่อร้านค้า",
          placeholderText: "ตั้งชื่อร้านค้าของคุณ",
          defaultValue: sellInfo.config.name,
        },
        () => {},
      );

      edit.addDropdown(
        {
          label: "สกอร์บอร์ด",
          options: scoreboardList,
          defaultValueIndex: currentScoreboardIndex,
        },
        () => {},
      );

      edit.show(pl).then((res) => {
        if (!res || res.canceled || !res.formValues) return;

        const name = String(res.formValues[2] ?? sellInfo.config.name);
        const sb = scoreboardList[res.formValues[3] as number] ??
          sellInfo.config.scoreboard;

        this.data = {
          ...d,
          [sellId]: {
            ...sellInfo,
            config: {
              ...sellInfo.config,
              name,
              scoreboard: sb,
            },
          },
        };

        PlayerUtils.sendToast(pl, "", `${name} ถูกอัปเดตแล้ว!`);
      });
    });

    form.addButton("ลบ", "textures/ui/icon_trash", () => {
      const next = { ...d };
      delete next[sellId];
      this.data = next;
      PlayerUtils.sendToast(pl, "", `${sellInfo.config.name} ถูกลบแล้ว!`);
    });

    form.addDivider();
    form.show(pl);
  }

  private getScore(pl: Player, scoreboardId: string) {
    const objective = this.plugin.world.scoreboard.getObjective(scoreboardId);
    return objective?.getScore(pl) ?? 0;
  }

  public openSellNPCMenu(pl: Player, marketId: string) {
    this.marketManagers.syncEconomy(marketId);

    const shopInfo = this.marketDataManagers.getNPCMarketData(marketId);
    if (!shopInfo) return;

    const form = IActionForm.createForm(
      `§m§n§r§m§t§r§f ${shopInfo.config.name}`,
    );

    form.setBody(
      "\n  §fยินดีต้อนรับสู่ร้าน" +
        `§e${shopInfo.config.name}` +
        "!\n" +
        `  §fยอดเงินของคุณ: §2${this.getScore(pl, shopInfo.config.scoreboard)}$`,
    );

    shopInfo.items.forEach((item, index) => {
      const price = Math.round(item.price * SellManagers.PRICE_RATE);

      const statusEmoji = item.price > item.defaultPrice
        ? ""
        : item.price < item.defaultPrice
        ? ""
        : "";
      const priceColor = item.price > item.defaultPrice
        ? "§a"
        : item.price < item.defaultPrice
        ? "§c"
        : "§e";

      form.addButton(
        this.pad(
          `§e${item.itemName}${
            Number.isFinite(item.stock) ? `\n§r${item.stock}x` : ""
          }`,
          100,
        ) +
          this.pad(`§f${statusEmoji} ${priceColor}${price}$`, 50) +
          this.pad("  ขาย", 50),
        item.icon || "",
        () => this.openSellMenu(pl, index, marketId),
      );
    });

    form.show(pl);
  }

  private pad(text = "", totalLength = 100) {
    return text.slice(0, totalLength).padEnd(totalLength, "\t");
  }

  public openSellMenu(pl: Player, itemIndex: number, marketId: string) {
    const marketInfo = this.marketDataManagers.getNPCMarketData(marketId);
    if (!marketInfo) return;

    const itemInfo = marketInfo.items[itemIndex];
    if (!itemInfo) return;

    const price = Math.round(itemInfo.price * SellManagers.PRICE_RATE);
    const maxSellable = this.getItemAmountInInventory(pl, itemInfo.itemId);

    if (maxSellable <= 0) {
      PlayerUtils.sendToast(
        pl,
        "",
        `§cคุณไม่มีไอเท็ม ${itemInfo.itemName} ในตัวของคุณ!`,
        itemInfo.icon,
      );
      return;
    }

    const form = IModalForm.createForm(
      this.pad(`§m§n§r${"§s§e§l§l§r"} ขายไอเท็ม: ${itemInfo.itemName}`, 100) +
        this.pad(itemInfo.icon || "", 150),
      "§fขาย",
    );

    form.addLabel(
      "\n              คุณต้องการขาย" +
        `\n               §e${itemInfo.itemName}§r` +
        `\n               ในราคา §c${price}$§r` +
        " หรือไม่?",
    );

    form.addLabel("\n");

    form.addToggle(
      { label: `ขายทั้งหมด? (${maxSellable}x)`, defaultValue: false },
      () => {},
    );

    form.addSlider(
      {
        label: "จำนวน",
        minimumValue: 1,
        maximumValue: maxSellable,
        valueStep: 1,
        defaultValue: 1,
      },
      () => {},
    );

    form.addDivider();

    form.addToggle({ label: "ยืนยันการขาย", defaultValue: false }, () => {});
    form.addDivider();

    form.show(pl).then((res) => {
      if (!res || res.canceled || !res.formValues) return;

      const useMax = Boolean(res.formValues[2]);
      const sliderQty = Number(res.formValues[3]);
      const confirm = Boolean(res.formValues[5]);

      if (!confirm) {
        PlayerUtils.sendToast(pl, "", "§cคุณต้องยืนยันการขายเพื่อดำเนินการต่อ");
        return;
      }

      const targetQty = Math.max(
        1,
        Math.min(maxSellable, useMax ? maxSellable : sliderQty),
      );

      let remaining = targetQty;
      let sold = 0;

      this.marketDataManagers.addTransactionToMarketHistory(marketId, {
        itemId: itemInfo.itemId,
        player: pl.name,
        quantity: targetQty,
        totalPrice: price * targetQty,
        date: new Date().toISOString(),
        timestamp: this.plugin.system.currentTick,
        transactionType: TransactionType.Sell,
      });

      const tick = () => {
        const current = this.getItemAmountInInventory(pl, itemInfo.itemId);

        if (remaining <= 0 || current <= 0) {
          PlayerUtils.stopTopbar(pl);
          this.marketDataManagers.editItemInMarket(marketId, itemIndex, {
            stock: itemInfo.stock += sold,
          });
          PlayerUtils.sendToast(
            pl,
            "",
            `ขาย §e${itemInfo.itemName}§r ไปเเล้ว ${sold} ชิ้น ในราคา §a${
              price * sold
            }$!`,
            itemInfo.icon,
          );
          pl.playSound("random.levelup");
          return;
        }

        remaining--;
        sold++;

        pl.runCommand(`clear @s ${itemInfo.itemId} 0 1`);
        pl.playSound("random.pop");
        this.addScore(pl, marketInfo.config.scoreboard, price);

        const pct = (sold / targetQty) * 100;
        PlayerUtils.sendTopbar(
          pl,
          `กำลังขาย §e${itemInfo.itemName} : §a${sold}x` +
            ` ในราคา §a${price * sold}$\n` +
            this.makeBar(pct, 20),
        );

        system.run(tick);
      };

      tick();
    });
  }

  private makeBar(percent: number, length: number) {
    const pct = Math.max(0, Math.min(100, percent));
    const totalUnits = length * 4;
    const filled = Math.round((pct / 100) * totalUnits);

    let out = "";
    for (let i = 0; i < length; i++) {
      const unit = Math.min(4, Math.max(0, filled - i * 4));
      const idx: BarKey = i === 0
        ? "start"
        : i === length - 1
        ? "end"
        : "middle";
      out += this.BAR[idx][unit];
    }
    return out;
  }

  private addScore(pl: Player, objectiveId: string, amount: number) {
    const scoreboard = this.plugin.world.scoreboard;
    const objective = scoreboard.getObjective(objectiveId) ??
      scoreboard.addObjective(objectiveId, objectiveId);

    objective.addScore(pl, amount);
  }

  private getItemAmountInInventory(pl: Player, itemId: string) {
    const inventory = pl.getComponent(EntityInventoryComponent.componentId)
      ?.container;
    if (!inventory) return 0;

    let total = 0;
    for (let i = 0; i < inventory.size; i++) {
      const it = inventory.getItem(i);
      if (it?.typeId === itemId) total += it.amount;
    }
    return total;
  }
}

export { SellManagers };
