import {
  Dimension,
  EnchantmentType,
  EnchantmentTypes,
  Entity,
  EntityInventoryComponent,
  ItemEnchantableComponent,
  ItemStack,
  Player,
  type Vector3,
} from "@minecraft/server";
import {
  IActionForm,
  IModalForm,
  MinecraftColors,
  PlayerUtils,
  PluginBase,
} from "@axeth/api";
import {
  type MarketItem,
  type MarketNPCData,
  TransactionType,
} from "../types/MarketData.ts";
import { MarketDataManagers } from "../class/MarketDataManagers.ts";
import { MarketManager } from "../class/MarketManager.ts";

class ShopManagers {
  private readonly plugin: PluginBase;
  private readonly marketDataManagers: MarketDataManagers;
  private readonly marketManagers: MarketManager;

  private static readonly SHOP_NPC_TAG = "shop_npc";
  private static readonly BUY_RATE = 1.15;

  private constructor(plugin: PluginBase, marketManagers: MarketManager) {
    this.plugin = plugin;
    this.marketManagers = marketManagers;
    this.marketDataManagers = new MarketDataManagers(plugin);
  }

  public static initialize(plugin: PluginBase, marketManagers: MarketManager) {
    return new ShopManagers(plugin, marketManagers);
  }

  private mc(text: string, color: keyof MinecraftColors = "white") {
    return new MinecraftColors(text)[color];
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

  public spawnShopNpc(shopId: string, position: Vector3, dimension: Dimension) {
    const info = this.data[shopId];
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

    npc.addTag(ShopManagers.SHOP_NPC_TAG);
    npc.addTag(`shop_setup:${shopId}`);
  }

  public isShopNpc(npc: Entity) {
    return npc.hasTag(ShopManagers.SHOP_NPC_TAG);
  }

  public isHasShop(shopId: string) {
    return shopId in this.data;
  }

  public showShopAdvancedSettings(pl: Player) {
    const form = IActionForm.createForm(
      "การตั้งค่าขั้นสูง",
      "กำหนดค่าตัวเลือกขั้นสูงสำหรับปลั๊กอินร้านค้า",
    );

    form.addDivider();
    form.addButton(this.mc("ปิด", "red"), "textures/ui/realms_red_x");
    form.addButton(
      `  รายการ NPC ร้านค้า : ${this.mc(String(this.size), "blue")}`,
    );

    const d = this.data;
    Object.keys(d).forEach((shopId) => {
      const info = d[shopId];
      if (!info) return;
      form.addButton(
        this.mc(info.config.name, "yellow") + ` [ ${shopId} ]`,
        "textures/ui/sidebar_icons/marketplace",
        () => this.showActionShopMenu(pl, shopId),
      );
    });

    form.show(pl);
  }

  private getScore(pl: Player, objectiveId: string) {
    const objective = this.plugin.world.scoreboard.getObjective(objectiveId);
    return objective?.getScore(pl) ?? 0;
  }

  private pad(text = "", totalLength = 100) {
    return text.slice(0, totalLength).padEnd(totalLength, "\t");
  }

  private cleanIdList(list?: string[]) {
    return (list ?? []).map((x) => x.trim()).filter((x) => x.length > 0);
  }

  private getItemStackFromData(itemData: MarketItem, quantity: number) {
    const itemStack = new ItemStack(itemData.itemId, quantity);

    const enchComp = itemStack.getComponent(
      ItemEnchantableComponent.componentId,
    );
    if (enchComp && itemData.enchantments?.length) {
      itemData.enchantments.forEach((e) => {
        const type = EnchantmentTypes.get(
          e.type as keyof typeof EnchantmentTypes,
        ) as EnchantmentType;
        if (!type) return;
        enchComp.addEnchantment({ type, level: e.level });
      });
    }

    const canPlaceOn = this.cleanIdList(itemData.canPlacedOn);
    if (canPlaceOn.length) itemStack.setCanPlaceOn(canPlaceOn);

    const canDestroy = this.cleanIdList(itemData.canDestroyedOn);
    if (canDestroy.length) itemStack.setCanDestroy(canDestroy);

    return itemStack;
  }

  public openShopMenu(pl: Player, marketId: string) {
    this.marketManagers.syncEconomy(marketId);

    const shopInfo = this.marketDataManagers.getNPCMarketData(marketId);
    if (!shopInfo) return;

    const form = IActionForm.createForm(
      this.mc(`§m§n§r${"§m§t§r"}§f ${shopInfo.config.name}`, "grey"),
      this.mc(`\n  ยินดีต้อนรับสู่ร้านค้า!`, "white") +
        this.mc(`\n  ยอดเงินของคุณ: `, "white") +
        this.mc(
          `${this.getScore(pl, shopInfo.config.scoreboard)}$`,
          "darkGreen",
        ),
    );

    shopInfo.items.forEach((item, index) => {
      const price = Math.round(item.price * ShopManagers.BUY_RATE);

      const statusEmoji = item.price > item.defaultPrice
        ? ""
        : item.price < item.defaultPrice
        ? ""
        : "";
      const priceColor = item.price > item.defaultPrice
        ? "§c"
        : item.price < item.defaultPrice
        ? "§a"
        : "§f";

      form.addButton(
        this.pad(
          `§e${item.itemName}§r${
            item.stock === null ? "" : `\n${item.stock}x`
          }`,
          100,
        ) +
          this.pad(`${statusEmoji} ${priceColor}${price}$`, 50) +
          this.pad("  ซื้อ", 20),
        item.icon || "",
        () => {
          if (item.stock !== null && item.stock <= 0) {
            PlayerUtils.sendToast(
              pl,
              "",
              `ขออภัย สินค้า ${this.mc(item.itemName, "yellow")} หมดสต็อกแล้ว!`,
              item.icon || "",
            );
            this.openShopMenu(pl, marketId);
            return;
          }
          this.openShopBuyMenu(pl, index, marketId);
        },
      );
    });

    form.show(pl);
  }

  public openShopBuyMenu(pl: Player, itemIndex: number, marketId: string) {
    const marketInfo = this.marketDataManagers.getNPCMarketData(marketId);
    if (!marketInfo) return;

    const itemInfo = marketInfo.items[itemIndex];
    if (!itemInfo) return;

    const money = this.getScore(pl, marketInfo.config.scoreboard);
    const unitPrice = Math.round(itemInfo.price * ShopManagers.BUY_RATE);

    const maxStack = new ItemStack(itemInfo.itemId, 1).maxAmount;
    const maxAffordable = Math.min(Math.floor(money / unitPrice), maxStack);
    const maxBuyable = itemInfo.stock !== null
      ? Math.min(maxAffordable, itemInfo.stock)
      : maxAffordable;

    if (maxBuyable <= 0) {
      PlayerUtils.sendToast(pl, "", this.mc("คุณไม่มีเงินพอซื้อสินค้านี้", "red"));
      return;
    }

    const form = IModalForm.createForm(
      this.pad(`§m§n§r§f${"§s§e§l§l§r"} ซื้อไอเท็ม: ${itemInfo.itemName}`, 100) +
        this.pad(itemInfo.icon || "", 150),
      "§fซื้อ",
    );

    form.addLabel(
      `\n${" ".repeat(15)}${this.mc("สินค้า: ", "white")}${
        this.mc(
          itemInfo.itemName,
          "yellow",
        )
      }\n` +
        `${" ".repeat(15)}${this.mc("ราคา: ", "white")}${
          this.mc(
            `${unitPrice}$`,
            "green",
          )
        }\n` +
        `${" ".repeat(15)}${this.mc("ยอดเงินของคุณ: ", "white")}${
          this.mc(
            `${money}$`,
            "darkGreen",
          )
        }\n`,
    );

    form.addLabel(" ");
    form.addDivider();

    form.addSlider(
      {
        label: `${this.pad(`§r§4§k§r${unitPrice}$`, 20)}`,
        minimumValue: 1,
        maximumValue: maxBuyable,
        valueStep: 1,
        defaultValue: 1,
      },
      () => {},
    );

    form.addToggle({ label: "ยืนยันการซื้อ", defaultValue: false }, () => {});
    form.addDivider();

    form.show(pl).then((res) => {
      if (!res || res.canceled || !res.formValues) return;

      const qty = Number(res.formValues[3]);
      const confirm = Boolean(res.formValues[4]);
      if (!confirm) {
        PlayerUtils.sendToast(
          pl,
          "",
          this.mc("คุณต้องยืนยันการซื้อเพื่อดำเนินการต่อ", "red"),
        );
        return;
      }

      const quantity = Math.max(1, Math.min(maxBuyable, qty));
      const totalPrice = unitPrice * quantity;

      const balance = this.getScore(pl, marketInfo.config.scoreboard);
      if (balance < totalPrice) {
        PlayerUtils.sendToast(
          pl,
          "",
          this.mc(
            `คุณไม่มีเงินเพียงพอที่จะซื้อ ${itemInfo.itemName} จำนวน ${quantity} ชิ้น!`,
            "red",
          ),
        );
        return;
      }

      this.marketDataManagers.addTransactionToMarketHistory(marketId, {
        player: pl.name,
        itemId: itemInfo.itemId,
        quantity,
        totalPrice,
        date: new Date().toISOString(),
        timestamp: this.plugin.system.currentTick,
        transactionType: TransactionType.Buy,
      });

      if (itemInfo.stock !== null && itemInfo.stock !== Infinity) {
        itemInfo.stock = Math.max(itemInfo.stock - quantity, 0);
      }

      const scoreboard = this.plugin.world.scoreboard;
      const objective = scoreboard.getObjective(marketInfo.config.scoreboard);
      if (!objective) return;

      objective.addScore(pl, -totalPrice);

      this.marketDataManagers.setNPCMarketData(marketId, {
        items: marketInfo.items,
      });

      const items = this.getItemStackFromData(itemInfo, quantity);
      pl.getComponent(EntityInventoryComponent.componentId)?.container?.addItem(
        items,
      );

      PlayerUtils.sendToast(
        pl,
        "",
        this.mc(
          `§fคุณได้ซื้อ §e${itemInfo.itemName}§f จำนวน §e${quantity} §fชิ้น ในราคา §c${totalPrice}$!`,
          "green",
        ),
      );

      this.openShopMenu(pl, marketId);
    });
  }

  private showActionShopMenu(pl: Player, shopId: string) {
    const d = this.data;
    const shopInfo = d[shopId];
    if (!shopInfo) return;

    const scoreboardList = this.plugin.world.scoreboard
      .getObjectives()
      .map((obj) => obj.id);

    const form = IActionForm.createForm(
      `${shopInfo.config.name} การกระทำ`,
      "เลือกการกระทำที่ต้องการดำเนินการ",
    );

    form.addDivider();
    form.addButton("สร้างร้านค้า", "textures/items/spawn_egg", () => {
      this.spawnShopNpc(shopId, pl.location, pl.dimension);
      PlayerUtils.sendToast(
        pl,
        "",
        `${shopInfo.config.name} ถูกสร้างแล้ว!`,
        "textures/ui/sidebar_icons/marketplace",
      );
    });

    form.addDivider();
    form.addLabel(this.mc("การกระทำ:", "grey"));

    form.addButton("แก้ไข", "textures/ui/book_edit_default", () => {
      const idx = Math.max(
        0,
        scoreboardList.indexOf(shopInfo.config.scoreboard),
      );

      const edit = IModalForm.createForm(
        `§m§n§r แก้ไข ${shopInfo.config.name}`,
        this.mc("แก้ไข"),
      );

      edit.addLabel("\n              กรอนข้อมูลร้านค้าใหม่ของคุณด้านล่าง");
      edit.addLabel("");

      edit.addTextField(
        {
          label: "ชื่อร้านค้า",
          placeholderText: "ตั้งชื่อร้านค้าของคุณ",
          defaultValue: shopInfo.config.name,
        },
        () => {},
      );

      edit.addDropdown(
        {
          label: "สกอร์บอร์ด",
          options: scoreboardList,
          defaultValueIndex: idx,
        },
        () => {},
      );

      edit.show(pl).then((res) => {
        if (!res || res.canceled || !res.formValues) return;

        const name = String(res.formValues[2] ?? shopInfo.config.name);
        const sb = scoreboardList[res.formValues[3] as number] ??
          shopInfo.config.scoreboard;

        this.data = {
          ...d,
          [shopId]: {
            ...shopInfo,
            config: {
              ...shopInfo.config,
              name,
              scoreboard: sb,
            },
          },
        };

        PlayerUtils.sendToast(pl, "", this.mc(`${name} ถูกแก้ไขแล้ว!`, "green"));
      });
    });

    form.addButton("ลบ", "textures/ui/icon_trash", () => {
      const next = { ...d };
      delete next[shopId];
      this.data = next;

      PlayerUtils.sendToast(
        pl,
        "",
        this.mc(`${shopInfo.config.name} ถูกลบแล้ว!`, "green"),
      );
    });

    form.addDivider();
    form.show(pl);
  }
}

export { ShopManagers };
