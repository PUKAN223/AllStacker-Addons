import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

class ACSettingItem extends ItemBuilder {
  public override basePath = "ac_setting.json";
  public override name = "ac_setting";

  public override getFormatVersion(): string {
    return "1.21.90";
  }

  public override getIdentifier(): string {
    return "kisu:ac_setting";
  }

  public override getCategory(): ItemCategory {
    return ItemCategory.Nature;
  }

  public override getComponents(): ItemComponents {
    return super.getComponents()
      .setIcon("bridge_ac_setting")
      .setDisplayName("All Stackers Settings\n§7[ Click to open ]§r")
      .setMaxStackSize(1)
      .setCustomComponent("kisu:show_config", {});
  }
}

export { ACSettingItem };
