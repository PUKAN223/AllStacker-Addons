import { IActionForm, IModalForm, PlayerUtils, PluginBase } from "@axeth/api";
import { Entity, EntityInventoryComponent, Player } from "@minecraft/server";
import { MarketDataManagers } from "./MarketDataManagers.ts";
import type { MarketItem } from "../types/MarketData.ts";
import { TransactionType } from "../types/MarketData.ts";
import { SellManagers } from "./SellManagers.ts";
import { ShopManagers } from "./ShopManagers.ts";

export enum MarketType {
  Buy,
  Sell,
}

class MarketManager {
  private plugin: PluginBase;
  private marketManagers: MarketDataManagers;

  private sellManagers!: SellManagers;
  private shopManagers!: ShopManagers;

  private constructor(plugin: PluginBase) {
    this.plugin = plugin;

    this.sellManagers = SellManagers.initialize(plugin, this);
    this.shopManagers = ShopManagers.initialize(plugin, this);

    this.marketManagers = new MarketDataManagers(plugin);
  }

  static initialize(plugin: PluginBase) {
    return new MarketManager(plugin);
  }

  public showAdminMenu(pl: Player, marketId: string) {
    //sync economy
    const shopInfo = this.marketManagers.getNPCMarketData(marketId);
    if (!shopInfo) return;

    const actionsSelector = IActionForm.createForm(
      `§m§n§r§f${"§a§d§m§m§t§r"}§r เมนูผู้ดูแลร้านค้า`,
    );
    actionsSelector.setBody(
      `\n   ${shopInfo.config.name} §7(${marketId})\n   §fยอดเงินคงเหลือ: §c${
        this.getScore(pl, shopInfo.config.scoreboard)
      }$`,
    );
    actionsSelector.addButton(`§h§rสินค้า ${shopInfo.items.length} รายการ`);
    actionsSelector.addButton(
      "§h§rเพิ่มไอเท็ม",
      "textures/ui/Add-Ons_Side-Nav_Icon_24x24",
      () => {
        this.showAddItemMenu(pl, marketId);
      },
    );

    for (const [index, item] of shopInfo.items.entries()) {
      actionsSelector.addButton(
        this.adjustTextLength(
          `§e${item.itemName}\n§f${
            item.stock ? item.stock.toString() + "x" : "ไม่จำกัด"
          }`,
          100,
        ) + this.adjustTextLength(`§r${item.price}§f$`, 50) +
          this.adjustTextLength(`§rจัดการ`, 20),
        item.icon || "",
        () => {
          this.showItemManageMenu(pl, index, marketId);
        },
      );
    }

    actionsSelector.show(pl);
  }

  public syncEconomy(marketId: string) {
    const marketInfo = this.marketManagers.getNPCMarketData(marketId);
    if (!marketInfo) return;

    marketInfo.items.forEach((item, idx) => {
      if (item.stock === null) return;
      const multiplier = Number(item.multiplier ?? 0.5);
      const newPrice = Math.floor(
        Math.max(item.minPrice, item.maxPrice - (item.stock * multiplier)),
      );
      marketInfo.items[idx]!.price = newPrice;
    });
    const tickSync = 20 * 60 * 45;
    if (
      this.plugin.system.currentTick - marketInfo.config.lastStockIncreaseSync >
        tickSync
    ) {
      marketInfo.items.forEach((item, idx) => {
        const stock = item.stock;
        if (stock === null || isNaN(stock)) return;
        const newStock = Math.max(stock * 0.90, 0);
        marketInfo.items[idx]!.stock = Math.round(newStock);
      });
      console.warn("Stock increased");
      marketInfo.config.lastStockIncreaseSync = this.plugin.system.currentTick;
    }
    this.marketManagers.setNPCMarketData(marketId, {
      items: marketInfo.items,
      config: marketInfo.config,
      history: marketInfo.history,
    });
  }

  private showItemManageMenu(pl: Player, itemIndex: number, marketId: string) {
    const shopInfo = this.marketManagers.getNPCMarketData(marketId);
    if (!shopInfo) return;
    const itemInfo = shopInfo.items[itemIndex];
    if (!itemInfo) return;
    const itemManageMenu = IActionForm.createForm(
      `§m§n§r จัดการไอเท็ม: ${itemInfo.itemName}`,
    );
    itemManageMenu.setBody(
      `\n  ไอดีสินค้า: ` + `§b${itemInfo.itemId}` +
        `\n` +
        `  ${"สูงสุด/ปกติ/ต่ำสุด"}: ` +
        `§a${itemInfo.maxPrice}$` + `/` +
        `§a${itemInfo.defaultPrice}$` + `/` +
        `§a${itemInfo.minPrice}$`,
    );

    itemManageMenu.addButton(
      `§fขายไอเท็ม`,
      "textures/items/book_normal",
      () => {
        this.sellManagers.openSellMenu(pl, itemIndex, marketId);
        // this.showSellMenu(pl, itemIndex);
      },
    );
    itemManageMenu.addButton(
      `§fซื้อไอเท็ม`,
      "textures/items/book_normal",
      () => {
        this.shopManagers.openShopBuyMenu(pl, itemIndex, marketId);
      },
    );
    itemManageMenu.addButton(
      `§fประวัติ`,
      "textures/items/book_normal",
      () => {
        this.showHistoryMenu(pl, itemIndex, marketId);
      },
    );
    itemManageMenu.addDivider();
    itemManageMenu.addButton(
      `§fแก้ไขไอเท็ม`,
      "textures/ui/book_edit_default",
      () =>
        this.showAddItemMenu(pl, marketId, {
          index: itemIndex,
          data: itemInfo,
        }),
    );
    itemManageMenu.addButton(
      `§fลบไอเท็ม`,
      "textures/ui/realms_red_x",
      () => {
        this.marketManagers.removeItemFromMarket(marketId, itemIndex);
        PlayerUtils.sendToast(
          pl,
          ``,
          `${shopInfo.config.name} : สินค้า ${itemInfo.itemName} ถูกลบออกจากร้านค้า!`,
        );
      },
    );
    itemManageMenu.addButton(
      `§cกลับ`,
      "textures/ui/arrowLeft",
      () => this.showAdminMenu(pl, marketId),
    );
    itemManageMenu.show(pl);
  }

  private showHistoryMenu(pl: Player, itemIndex: number, marketId: string) {
    const shopInfo = this.marketManagers.getNPCMarketData(marketId);
    if (!shopInfo) return;
    const itemInfo = shopInfo.items[itemIndex];
    if (!itemInfo) return;

    const historyMenu = IActionForm.createForm(
      `§m§n§r ประวัติการทำรายการ: ${itemInfo.itemName}`,
    );
    const itemTransactions = shopInfo.history.filter((tx) =>
      tx.itemId === itemInfo.itemId
    );

    historyMenu.setBody(
      `\n\n      §fประวัติการขายไอเท็มนี้ (${itemTransactions.length} รายการ)\n      §7รวมประวัติทั้งหมด: ${shopInfo.history.length}/60 รายการ\n`,
    );
    const trans = itemTransactions.slice().reverse();

    trans.forEach((tx) => {
      historyMenu.addButton(
        `${tx.player} §a${tx.quantity}x §e[${
          tx.transactionType === TransactionType.Buy ? "ซื้อ" : "ขาย"
        }] §r§7${this.toThaiDateString(new Date(tx.timestamp))}`,
        "textures/items/book_normal",
        () => {},
      );
    });

    historyMenu.addDivider();
    historyMenu.addButton(
      `§cลบประวัติไอเท็มนี้`,
      "textures/ui/realms_red_x",
      () => {
        this.marketManagers.removeOldTransactionsByItemId(
          marketId,
          itemInfo.itemId,
        );
        PlayerUtils.sendToast(
          pl,
          ``,
          `ลบประวัติการทำรายการของ ${itemInfo.itemName} แล้ว!`,
        );
        this.showItemManageMenu(pl, itemIndex, marketId);
      },
    );
    historyMenu.addButton(
      `§cย้อนกลับ`,
      "textures/ui/arrowLeft",
      () => this.showItemManageMenu(pl, itemIndex, marketId),
    );
    historyMenu.show(pl);
  }

  private toThaiDateString(date: Date): string {
    const monthNames = [
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
    ];

    const year = date.getFullYear() + 543;
    const month = monthNames[date.getMonth()];
    const numOfDay = date.getDate();

    return `${numOfDay}/${month}/${year} `;
  }

  private showAddItemMenu(
    pl: Player,
    shopId: string,
    edit?: {
      index: number;
      data: MarketItem;
    },
  ) {
    const shopInfo = this.marketManagers.getNPCMarketData(shopId);
    if (!shopInfo) return;

    const formValue = {
      itemId: "",
      isUseHoldItem: false,
      itemName: "",
      itemIcon: "",
      itemMaxPrice: 0,
      itemMinPrice: 0,
      canPlaceOn: [] as string[],
      canDestroyOn: [] as string[],
      enchantment: [] as { type: string; level: number }[],
      hasUnlimitedStock: false,
      multiplier: "0.5",
      stock: 0,
    };

    const addItemMenu = IModalForm.createForm(
      `§f§m§n§r§f เพิ่มไอเท็มในร้าน`,
      edit ? `§fแก้ไขไอเท็ม` : `§fเพิ่มไอเท็ม`,
    );
    addItemMenu.addLabel(
      ` > กรอกข้อมูลไอเท็ม` + "\n",
    );
    addItemMenu.addTextField(
      {
        label: `ไอดีไอเท็ม`,
        placeholderText: `กรอกไอดีของไอเท็ม`,
        defaultValue: edit?.data?.itemId || ``,
      },
      (value) => formValue.itemId = value,
    );
    addItemMenu.addToggle(
      {
        label: `ใช้ไอเท็มที่ถืออยู่?`,
        defaultValue: false,
      },
      (value) => formValue.isUseHoldItem = value,
    );
    addItemMenu.addTextField(
      {
        label: `ชื่อไอเท็ม (ไม่บังคับ)`,
        placeholderText: `กรอกชื่อของไอเท็ม`,
        defaultValue: edit?.data?.itemName || ``,
      },
      (value) => formValue.itemName = value,
    );
    addItemMenu.addTextField(
      {
        label: `ไอคอนไอเท็ม (ไม่บังคับ)`,
        placeholderText: `กรอกไอคอนของไอเท็ม`,
        defaultValue: edit?.data?.icon || ``,
      },
      (value) => formValue.itemIcon = value,
    );
    addItemMenu.addDivider();
    addItemMenu.addTextField(
      {
        label: `ราคาสูงสุด`,
        placeholderText: `กรอกราคาสูงสุดของไอเท็ม`,
        defaultValue: edit ? `${edit.data.maxPrice}` : ``,
      },
      (value) => formValue.itemMaxPrice = parseInt(value),
    );
    addItemMenu.addTextField(
      {
        label: `ราคาต่ำสุด`,
        placeholderText: `กรอกราคาต่ำสุดของไอเท็ม`,
        defaultValue: edit ? `${edit.data.minPrice}` : ``,
      },
      (value) => formValue.itemMinPrice = parseInt(value),
    );
    addItemMenu.addTextField(
      {
        label: `ค่าคูณคงที่`,
        placeholderText: `กรอกค่าคูณคงที่ของไอเท็ม`,
        defaultValue: edit ? `${edit.data.multiplier}` : `0.5`,
      },
      (value) => formValue.multiplier = String(value),
    );
    addItemMenu.addDivider();
    addItemMenu.addTextField(
      {
        label: `สามารถวางบนบล็อค (ไม่บังคับ)`,
        placeholderText: `Ex. minecraft:stone,minecraft:dirt`,
        defaultValue: edit ? edit.data.canPlacedOn?.join(",") : ``,
      },
      (value) =>
        formValue.canPlaceOn = value.trim() === ""
          ? []
          : value.split(",").map((v) => v.trim()).filter((v) => v.length > 0),
    );
    addItemMenu.addTextField(
      {
        label: `สามารถทำลายบล็อค (ไม่บังคับ)`,
        placeholderText: `Ex. minecraft:stone,minecraft:dirt`,
        defaultValue: edit ? edit.data.canDestroyedOn?.join(",") : ``,
      },
      (value) =>
        formValue.canDestroyOn = value.trim() === ""
          ? []
          : value.split(",").map((v) => v.trim()).filter((v) => v.length > 0),
    );
    addItemMenu.addTextField(
      {
        label: `เอนชานต์ (ไม่บังคับ)`,
        placeholderText: `Ex. sharpness:5,unbreaking:3`,
        defaultValue: edit
          ? edit.data.enchantments?.map((e) => `${e.type}:${e.level}`).join(",")
          : ``,
      },
      (value) =>
        formValue.enchantment = value.trim() === ""
          ? []
          : value.split(",").map((v) => {
            const [idRaw, levelRaw] = v.split(":");
            const id = idRaw?.trim() ?? "";
            const level = Number.parseInt(levelRaw ?? "0") || 0;
            return { type: id, level };
          }),
    );
    addItemMenu.addDivider();
    addItemMenu.addToggle(
      {
        label: `มีสต็อกไม่จำกัด?`,
        defaultValue: edit ? edit.data.stock === undefined : false,
      },
      (value) => {
        formValue.hasUnlimitedStock = value;
      },
    );
    addItemMenu.addTextField(
      {
        label: `สต็อกไอเท็ม`,
        placeholderText: `กรอกจำนวนสต็อกของไอเท็ม`,
        defaultValue: edit ? edit.data.stock?.toString() ?? "700" : "700",
      },
      (value) => {
        formValue.stock = parseInt(value);
      },
    );

    addItemMenu.addDivider();
    addItemMenu.show(pl).then((res) => {
      if (!res) return;
      if (res.canceled || !res.formValues) return;
      const itemId = formValue.itemId;
      const useHoldItem = formValue.isUseHoldItem;
      const itemName = formValue.itemName;
      const itemIcon = formValue.itemIcon;

      const maxPrice = formValue.itemMaxPrice;
      const minPrice = formValue.itemMinPrice;
      const defaultPrice = Math.round((maxPrice + minPrice) / 2);
      const multiplier = formValue.multiplier;

      const holdItem = pl.getComponent(EntityInventoryComponent.componentId)
        ?.container.getItem(pl.selectedSlotIndex);

      if (useHoldItem && !holdItem) {
        PlayerUtils.sendToast(pl, ``, `คุณไม่ได้ถือไอเท็มใดๆ!`);
        return;
      }

      const itemToAdd = useHoldItem ? holdItem!.typeId : itemId;

      if (edit?.index !== undefined) {
        this.marketManagers.editItemInMarket(shopId, edit.index, {
          itemId: itemToAdd,
          itemName: itemName || this.itemIdToName(itemToAdd),
          defaultPrice: defaultPrice,
          maxPrice: maxPrice,
          minPrice: minPrice,
          icon: itemIcon,
          multiplier: multiplier,
          stock: formValue.hasUnlimitedStock ? undefined : formValue.stock,
        });
        PlayerUtils.sendToast(
          pl,
          ``,
          `ไอเท็ม ${
            this.itemIdToName(itemToAdd)
          } ถูกแก้ไขใน ${shopInfo.config.name}!`,
        );
      } else {
        this.marketManagers.addItemToMarket(shopId, {
          itemId: itemToAdd,
          itemName: itemName || this.itemIdToName(itemToAdd),
          defaultPrice: defaultPrice,
          price: defaultPrice,
          maxPrice: maxPrice,
          minPrice: minPrice,
          icon: itemIcon,
          multiplier: multiplier,
          canDestroyedOn: [],
          canPlacedOn: [],
          stock: formValue.stock,
          enchantments: [],
        });
        PlayerUtils.sendToast(
          pl,
          ``,
          `ไอเท็ม ${
            this.itemIdToName(itemToAdd)
          } ถูกเพิ่มใน ${shopInfo.config.name}!`,
        );
      }
    });
  }

  public showSetupMenu(pl: Player, npc: Entity, type: MarketType) {
    const setupMenu = IModalForm.createForm(
      `§m§n§r ตั้งค่า NPC ${type === MarketType.Buy ? "ซื้อของ" : "ขายของ"}`,
      `§fบันทึกการเปลี่ยนแปลง`,
    );

    const formData: {
      marketSelectId: string | undefined;
      marketName: string;
      marketId: string;
      marketScoreboard: string;
    } = {
      marketSelectId: undefined,
      marketName: "",
      marketId: "",
      marketScoreboard: "",
    };

    const scoreboard = this.plugin.world.scoreboard;
    const listMarketData = this.marketManagers.data;
    const listMarketId = Object.keys(listMarketData);

    const scoreboardLists = scoreboard.getObjectives().length > 0
      ? scoreboard.getObjectives().map((obj) => obj.id)
      : ["No Scoreboards Available"];

    setupMenu.addLabel("");
    setupMenu.addLabel(
      `§eตั้งค่า NPC ขายของใหม่`,
    );
    setupMenu.addDropdown({
      label: `เลือกร้านค้า`,
      options: ["สร้างใหม่", ...listMarketId],
    }, (value) => {
      console.warn(value);
      if (!value) {
        formData.marketSelectId = undefined;
      } else {
        formData.marketSelectId = listMarketId[value - 1];
      }
    });
    setupMenu.addDivider();
    setupMenu.addTextField(
      {
        label: `ชื่อร้านค้า`,
        placeholderText: `กรอกชื่อร้านค้า`,
        defaultValue: `ร้านค้าของฉัน`,
      },
      (value) => {
        formData.marketName = value;
      },
    );
    //default is shop_00X (counter);
    const defaultMarketId = `market_${
      (this.marketManagers.size + 1).toString().padStart(3, "0")
    }`;
    setupMenu.addTextField(
      {
        label: `ไอดีร้านค้า`,
        placeholderText: `กรอกไอดีเฉพาะสำหรับร้านค้า`,
        defaultValue: defaultMarketId,
      },
      (value) => {
        formData.marketId = value;
      },
    );
    setupMenu.addDropdown(
      {
        label: `สกอบอร์ด`,
        options: scoreboardLists,
        defaultValueIndex: 0,
      },
      (value) => {
        formData.marketScoreboard = scoreboardLists[value]!;
      },
    );
    setupMenu.addDivider();
    setupMenu.show(pl).then((res) => {
      if (!res) return;
      if (res.canceled || !res.formValues) return;
      if (formData.marketSelectId !== undefined) {
        npc.addTag(
          `${
            type === MarketType.Buy ? "shop" : "sell"
          }_setup:${formData.marketSelectId}`,
        );
        npc.removeTag((MarketType.Buy ? "shop" : "sell") + "_npc");
      } else {
        const sellName = formData.marketName;
        const sellIdentifier = formData.marketId;
        const selectedScoreboard = formData.marketScoreboard;

        this.marketManagers.initializeNpcMarketData(sellIdentifier, {
          lastEconomySync: this.plugin.system.currentTick,
          name: sellName,
          scoreboard: selectedScoreboard,
          lastStockIncreaseSync: this.plugin.system.currentTick,
        });
        npc.addTag(
          `${
            type === MarketType.Buy ? "shop" : "sell"
          }_setup:${sellIdentifier}`,
        );
        npc.removeTag((MarketType.Buy ? "shop" : "sell") + "_npc");
        npc.nameTag = sellName;
      }
    });
  }

  private itemIdToName(itemId: string): string {
    return itemId.split(":")[1]!.split("_").map((word) =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  }

  private getScore(pl: Player, scoreboard: string) {
    const objective = this.plugin.world.scoreboard.getObjective(scoreboard);
    if (!objective) return 0;
    return objective.getScore(pl) ?? 0;
  }

  private adjustTextLength(text = "", totalLength = 100) {
    return (text.slice(0, totalLength)).padEnd(totalLength, "\t");
  }
}

export { MarketManager };
