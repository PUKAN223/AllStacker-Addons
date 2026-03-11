import { IActionForm, PluginBase, type PluginSettingOptions } from "@axeth/api";
import { PoliceArrestManager } from "./class/PoliceArrestManager.ts";
import { ItemStack, Player, world } from "@minecraft/server";

interface PoliceSearchPlayerEvent {
  police: Player;
  player: Player;
}

class PolicePlugin extends PluginBase {
  public override name: string = "PolicePlugin";
  public override version: string = "1.0.0";
  public override icon: string = "textures/items/tools/handcuff";

  private readonly robberPrefix = "§c✔ ";
  private policeArrestManager = PoliceArrestManager.initialize(this);

  public override onLoad(): void {
    this.events.on<"CustomPoliceSearchPlayer", PoliceSearchPlayerEvent>(
      "CustomPoliceSearchPlayer",
      ({ police, player }) => {
        this.system.run(() => {
          this.openSearchPlayerMenu(police, player);
        });
      },
    );
    this.itemActionManager.registerItem("kisu:handcuff").onUse(async (pl) => {
      await this.policeArrestManager.handleArrest(pl);
    });

    this.events.on("AfterTick", (ev) => {
      this.policeArrestManager.handleTick(ev);
      if (ev.currentTick % 20 === 0) {
        this.updateRobberNameTags();
      }
    });
  }

  private updateRobberNameTags(): void {
    for (const player of world.getAllPlayers()) {
      const currentNameTag = player.nameTag ?? "";
      const hasPrefix = currentNameTag.startsWith(this.robberPrefix);

      if (player.hasTag("robber")) {
        const baseName = hasPrefix
          ? currentNameTag.slice(this.robberPrefix.length)
          : (currentNameTag || player.name);
        player.nameTag = `${this.robberPrefix}${baseName}`;
        continue;
      }

      if (hasPrefix) {
        player.nameTag = currentNameTag.slice(this.robberPrefix.length);
      }
    }
  }

  private openSearchPlayerMenu(police: Player, player: Player): void {
    const invComp = player.getComponent("inventory");
    if (!invComp) return;
    const items = this.getAllItemsFromInventory(player);
    const displayName = this.getSearchDisplayName(player);
    const searchUi = IActionForm.createForm(
      `§fค้นตัว §e${displayName}`,
      ` กำลังค้นตัวผู้เล่น ${displayName}`,
    );
    searchUi.addDivider();
    for (const { item, slot } of items) {
      searchUi.addButton(
        ` §e${
          this.itemIdToName(item.typeId)
        } §c${item.amount} §7ชิ้น - §7ช่องที่ §f${slot}§r`,
        "textures/items/iron_sword",
        () => {
        },
      );
    }
    searchUi.show(police);
  }

  private getSearchDisplayName(player: Player): string {
    return player.nameTag || player.name;
  }

  private itemIdToName(itemId: string): string {
    return itemId.split(":")[1]!.split("_").map((word) =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  }

  private getAllItemsFromInventory(
    player: Player,
  ): { item: ItemStack; slot: number }[] {
    const invComp = player.getComponent("inventory");
    if (!invComp) return [];
    const items: { item: ItemStack; slot: number }[] = [];
    for (let slot = 0; slot < invComp.container.size; slot++) {
      const item = invComp.container.getItem(slot);
      if (item) {
        items.push({ item, slot });
      }
    }
    return items;
  }

  public override getSettings(): PluginSettingOptions {
    return {
      arrestData: {
        canUserModify: false,
        description: "Data of arrested players by police",
        type: "string",
        default: "{}",
      },
    };
  }
}

export { PolicePlugin };
