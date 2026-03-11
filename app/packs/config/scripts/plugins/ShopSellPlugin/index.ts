import {
  IActionForm,
  PlayerUtils,
  PluginBase,
  type PluginSettingOptions,
} from "@axeth/api";
import { SellManagers } from "./class/SellManagers.ts";
import { ShopManagers } from "./class/ShopManagers.ts";
import { Entity, Player } from "@minecraft/server";
import { MarketManager, MarketType } from "./class/MarketManager.ts";

class MarketPlugin extends PluginBase {
  public override name: string = "MarketPlugin";
  public override version: string = "1.0.0";
  public override icon: string = "textures/ui/sidebar_icons/marketplace";

  private sellManagers!: SellManagers;
  private shopManagers!: ShopManagers;
  private marketManager!: MarketManager;

  public override onLoad(): void | Promise<void> {
    this.marketManager = MarketManager.initialize(this);
    this.sellManagers = SellManagers.initialize(this, this.marketManager);
    this.shopManagers = ShopManagers.initialize(this, this.marketManager);

    //Events
    this.onSellNPCInteract();
    this.onShopNPCInteract();
  }

  public override getSettings(): PluginSettingOptions {
    return {
      marketData: {
        canUserModify: false,
        default: "{}",
        type: "string",
        description: "Data for all market in the server.",
      },
    };
  }

  public onShopNPCInteract(): void {
    this.events.on("BeforePlayerInteractWithEntity", async (ev) => {
      if (!this.shopManagers.isShopNpc(ev.target)) return;
      if (ev.player.isSneaking && ev.player.hasTag("admin")) return;
      ev.cancel = true;

      await this.system.waitTicks(1);

      const marketId = this.getShopId(ev.target);

      if (!marketId) return;

      if (
        !this.shopManagers.isHasShop(marketId) && marketId
      ) {
        ev.target.removeTag(`shop_setup:${marketId}`);
        PlayerUtils.sendToast(
          ev.player,
          ``,
          this.mcColors("ไม่เจอข้อมูลร้านค้า ลองตั้งค่าใหม่อีกครั้ง!").red,
        );
        return;
      }

      if (this.getIsShopSetup(ev.target)) {
        // shopNpc.openSetupMenu(ev.player);
        this.marketManager.showSetupMenu(ev.player, ev.target, MarketType.Buy);
        return;
      } else {
        if (ev.player.hasTag("admin") && marketId) {
          this.marketManager.showAdminMenu(ev.player, marketId);
        } else {
          this.shopManagers.openShopMenu(ev.player, marketId);
        }
      }
    });
  }

  public onSellNPCInteract() {
    this.events.on("BeforePlayerInteractWithEntity", async (ev) => {
      if (!this.sellManagers.isSellNpc(ev.target)) return;
      if (ev.player.isSneaking && ev.player.hasTag("admin")) return;
      ev.cancel = true;

      await this.system.waitTicks(1);

      const marketId = this.getSellNPCId(ev.target);

      if (!marketId) return;

      if (
        !this.sellManagers.isHasSell(marketId ?? "")
      ) {
        ev.target.removeTag(`sell_setup:${marketId}`);
        PlayerUtils.sendToast(
          ev.player,
          ``,
          this.mcColors("ไม่เจอข้อมูลร้านค้า ลองตั้งค่าใหม่อีกครั้ง!").red,
        );
        return;
      }

      if (this.getIsSellSetup(ev.target)) {
        this.marketManager.showSetupMenu(ev.player, ev.target, MarketType.Sell);
        return;
      } else {
        if (ev.player.hasTag("admin") && marketId) {
          this.marketManager.showAdminMenu(ev.player, marketId);
        } else {
          this.sellManagers.openSellNPCMenu(ev.player, marketId);
        }
      }
    });
  }

  public override getAdvancedSettings(
    pl: Player,
    _plugin: PluginBase,
  ): (() => void) | null {
    return () => {
      const advancedMenu = IActionForm.createForm(`เมนูจัดการระบบซื้อขาย`);
      advancedMenu.addButton(
        `ร้านค้าซื้อ`,
        "textures/ui/sidebar_icons/marketplace",
        () => {
          try {
            this.shopManagers.showShopAdvancedSettings(
              pl,
            );
          } catch (error) {
            console.warn(error);
          }
        },
      );
      advancedMenu.addButton(
        `ร้านค้าขาย`,
        "textures/ui/sidebar_icons/marketplace",
        () => {
          try {
            this.sellManagers.showSellAdvancedSettings(
              pl,
            );
          } catch (error) {
            console.warn(error);
          }
        },
      );

      advancedMenu.show(pl);
    };
  }

  private getSellNPCId(en: Entity) {
    return en.getTags().find((tag) => tag.startsWith("sell_setup:"))?.split(
      ":",
    )[1];
  }

  private getShopId(en: Entity) {
    return en.getTags().find((tag) => tag.startsWith("shop_setup:"))?.split(
      ":",
    )[1];
  }

  private getIsSellSetup(en: Entity) {
    return en.hasTag("sell_setup");
  }

  private getIsShopSetup(en: Entity) {
    return en.hasTag("sell_setup");
  }
}

export { MarketPlugin };
