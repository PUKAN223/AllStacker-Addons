import { ItemStack, Player } from "@minecraft/server";
import { IActionForm } from "@axeth/api";

class RobberManagers {
  private constructor() {
    // Initialization code here
  }

  static initialize() {
    return new RobberManagers();
  }

  public handleRobbery(player: Player, target: Player): void {
    const robberUi = IActionForm.createForm(
      `§8ปล้น §6${target.nameTag}`,
      ` คุณกำลังปล้น §e${target.nameTag}\nเลือกไอเท็มที่จะปล้น`,
    );
    const inventories = this.getAllItemsFromInventory(target);
    robberUi.addDivider();
    for (const items of inventories) {
      robberUi.addButton(
        "§8" +
          this.itemIdToName(items.item.typeId) +
          `\n§8จำนวน §c${items.item.amount} §8ชิ้น`,
        "",
        () => this.robItemFromTarget(player, target, items.slot),
      );
    }
    robberUi.addDivider();
    robberUi.addButton("ปิด");
    robberUi.show(player);
  }

  private robItemFromTarget(
    player: Player,
    target: Player,
    slot: number,
  ): void {
    const targetInvComp = target.getComponent("inventory");
    const playerInvComp = player.getComponent("inventory");
    if (!targetInvComp || !playerInvComp) return;
    targetInvComp.container.transferItem(slot, playerInvComp.container);
  }

  private itemIdToName(itemId: string): string {
    return itemId
      .split(":")[1]!
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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
}

export { RobberManagers };
