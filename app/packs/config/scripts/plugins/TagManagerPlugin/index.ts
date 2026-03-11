import { PluginBase } from "@axeth/api";
import { Entity, EntityInventoryComponent, Player } from "@minecraft/server";
import { IModalForm } from "../../../../../../packages/api/src/class/forms/IModalForm.ts";

class TagManagerPlugin extends PluginBase {
  public override name: string = "Tag Managers";
  public override version: string = "1.0.0";

  public override onLoad(): void | Promise<void> {
    this.events.on("BeforePlayerInteractWithEntity", (ev) => {
      const inv = ev.player.getComponent(EntityInventoryComponent.componentId);
      const holdItem = inv?.container.getItem(ev.player.selectedSlotIndex);

      if (!holdItem) {
        return;
      }
      if (holdItem.typeId === "minecraft:compass") {
        ev.cancel = true;
        this.system.run(() => {
          this.showTagManagerUI(ev.player, ev.target);
        });
      }
    });
  }

  private showTagManagerUI(pl: Player, target: Entity) {
    const tagManager = IModalForm.createForm(
      `Tag Managers`,
    );

    tagManager.addTextField({
      label: "Tag Name",
      placeholderText: "Enter tag name",
    }, (value) => {
      if (value) {
        target.addTag(value);
      }
    });

    tagManager.show(pl);
  }
}

export { TagManagerPlugin };
