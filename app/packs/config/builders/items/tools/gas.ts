import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

class GasItem extends ItemBuilder {
  public override basePath: string = "tools/gas_item.json";
  public override name: string = "gas";

  public override getIdentifier(): string {
    return "kisu:gas";
  }

  public override getCategory(): ItemCategory {
    return ItemCategory.Equipment;
  }

  public override getComponents(): ItemComponents {
    const component = super.getComponents();
    component.setDisplayName(`ถังน้ำมัน`);
    component.setIcon("gas");
    component.setMaxStackSize(1);
    component.setCustomComponent("minecraft:can_destroy_in_creative", false);
    return component;
  }
}

export { GasItem };
