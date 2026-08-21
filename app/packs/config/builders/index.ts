import { AxethBuilder } from "@axeth/builder";
import { ACSettingItem } from "./items/ACSettingItem.ts";

class Builder extends AxethBuilder {
  public override onBuild() {
    this.itemBuilderManager.registerItemBuilder(ACSettingItem);
  }
}

export default Builder;
