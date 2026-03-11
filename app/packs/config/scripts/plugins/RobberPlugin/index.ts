import { PluginBase, type PluginSettingOptions } from "@axeth/api";
import { RobberManagers } from "./class/RobberManagers.ts";
import { Player } from "@minecraft/server";

class RobberPlugin extends PluginBase {
  private robberManagers = RobberManagers.initialize();

  public override onLoad(): void {
    const itemRobber = this.config.get()["robberItem"]!.value as string || "";

    this.events.on("BeforePlayerInteractWithEntity", (ev) => {
      if (ev.itemStack?.typeId === itemRobber) {
        ev.cancel = true;

        this.system.run(() => {
          if (ev.target instanceof Player) this.robberManagers.handleRobbery(ev.player, ev.target);
        });
      }
    });
  }

  public override getSettings(): PluginSettingOptions {
    return {
      robberItem: {
        canUserModify: true,
        default: "minecraft:compass",
        description: "Item use for rob player died",
        type: "string",
      },
    };
  }
}

export { RobberPlugin };
