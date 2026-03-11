import { PluginBase, type PluginSettingOptions } from "@axeth/api";
import { CookingManager } from "./class/CookingManager.ts";
import { Player } from "@minecraft/server";

class CookingPlugin extends PluginBase {
  public override name: string = "CookingPlugin";
  public override version: string = "1.0.0";

  private cookingManager!: CookingManager;

  public override onLoad(): void | Promise<void> {
    this.cookingManager = CookingManager.initialize(this);
  }

  public override getAdvancedSettings(pl: Player, _plugin: PluginBase): (() => void) | null {
    return () => {
      this.cookingManager.showAdvancedCookingUI(pl)
    }
  }

  public override getSettings(): PluginSettingOptions {
    return {
      "cookingData": {
        type: "string",
        default: "{}",
        canUserModify: false,
        description: "Cooking data",
      },
      "cookingRecipes": {
        type: "string",
        default: "{}",
        canUserModify: false,
        description: "Cooking recipes",
      },
    };
  }
}

export { CookingPlugin };
