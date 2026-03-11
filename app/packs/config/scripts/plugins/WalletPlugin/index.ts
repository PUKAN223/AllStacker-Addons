import { PluginBase, type PluginSettingOptions } from "@axeth/api";
import { WalletManager } from "./class/WalletManager.ts";

class WalletPlugin extends PluginBase {
  public override name: string = "WalletPlugin";
  public override version: string = "1.0.0";
  public override icon: string = "textures/items/others/wallet";

  private walletManager!: WalletManager;

  public override onLoad(): void {
    this.walletManager = WalletManager.initialize(this);
  }

  public override getPluginSettings(): PluginSettingOptions {
    return {
      "walletProfile": {
        canUserModify: false,
        default: "{}",
        type: "string",
        description: "",
      },
    };
  }
}

export { WalletPlugin };
