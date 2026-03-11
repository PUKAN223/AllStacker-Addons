import { PluginBase } from "@axeth/api";
import {
  EntityInventoryComponent,
  ItemLockMode,
  ItemStack,
  Player,
} from "@minecraft/server";
import { PlayerUtils } from "../../../../../../packages/api/src/global/Player.ts";

class StarterItemPlugin extends PluginBase {
  public override name: string = "StarterItemPlugin";
  public override version: string = "1.0.0";

  public override onLoad(): void | Promise<void> {
    this.events.on("AfterTick", ({ currentTick }) => {
      if (currentTick % 40 === 0) {
        const playersWithTags = this.world.getAllPlayers().filter((player) =>
          player.hasTag("StarterItem")
        );

        playersWithTags.forEach((player) => {
          this.giveStartItem(player);
          player.removeTag("StarterItem");
          player.addTag("StarterItemTrue");
        });
      }
    });
  }

  private giveStartItem(player: Player): void {
    const bread = new ItemStack("minecraft:bread", 16);
    const wallet = new ItemStack("kisu:wallet", 1);
    wallet.lockMode = ItemLockMode.inventory;
    const phone = new ItemStack("kisu:phone", 1);

    const items = [{
      item: bread,
      icon: "textures/items/bread",
    }, {
      item: wallet,
      icon: "textures/items/others/wallet",
    }, {
      item: phone,
      icon: "textures/items/smartphone",
    }];

    items.forEach((data) => {
      const inv = player.getComponent(EntityInventoryComponent.componentId)
        ?.container;
      if (inv) {
        inv.addItem(data.item);
        PlayerUtils.sendToast(
          player,
          ``,
          `§7คุณได้รับ §e${
            this.itemIdToName(data.item.typeId)
          } §c${data.item.amount}x§r`,
          data.icon,
        );
      }
    });

    if (this.world.scoreboard.getObjective("money")) {
      this.world.scoreboard.getObjective("money")?.addScore(
        player,
        5000,
      );
      PlayerUtils.sendToast(
        player,
        ``,
        `§7คุณได้รับเงิน §e5000§r §7บาท`,
      );
    }

    player.addTag("car:bicycle");
    PlayerUtils.sendToast(
      player,
      ``,
      `§7คุณได้รับจักรยาน`,
      `textures/icon/bicycle`,
    );
  }

  private itemIdToName(itemId: string): string {
    return itemId.split(":")[1]!.split("_").map((word) =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  }
}

export { StarterItemPlugin };
