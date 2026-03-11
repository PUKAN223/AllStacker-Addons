import { PluginBase, type PluginSettingOptions } from "@axeth/api";
import { VehicleManager } from "./class/VehicleManager.ts";

class VehiclePlugin extends PluginBase {
  public override name: string = "VehiclePlugin";
  public override version: string = "1.0.0";
  public override icon: string = "textures/icon/rx115";

  private vehicleManager!: VehicleManager;

  public override onLoad(): void | Promise<void> {
    this.vehicleManager = VehicleManager.initialize(this);
  }

  public override getSettings(): PluginSettingOptions {
    return {
      "vehicleData": {
        type: "string",
        description: "Vehicle",
        canUserModify: false,
        default: "{}",
      },
    };
  }
}

export { VehiclePlugin };
