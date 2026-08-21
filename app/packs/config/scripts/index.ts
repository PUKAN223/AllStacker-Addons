import { SystemBase } from "@axeth/api";
import { ItemStackerPlugin } from "./plugins/ItemStacker/index.ts";
import { MobStackerPlugin } from "./plugins/MobStacker/index.ts";
import { ConfigMenuPlugin } from "./plugins/ConfigMenu/index.ts";

class AxethAPI extends SystemBase {
  public override onLoad(): void {
    this.pluginManagers.registerPlugin(ItemStackerPlugin, MobStackerPlugin, ConfigMenuPlugin);
  }
}

new AxethAPI();
