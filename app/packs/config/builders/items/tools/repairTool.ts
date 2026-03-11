import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

class RepairTools extends ItemBuilder {
  public override basePath: string = "tools/repair_tools.json";
  public override name: string = "repair_tools";

  public override getIdentifier(): string {
    return "kisu:repair_tools";
  }

  public override getCategory(): ItemCategory {
    return ItemCategory.Equipment;
  }

  public override getComponents(): ItemComponents {
    const component = super.getComponents();
    component.setDisplayName(`เครื่องมือซ่อม`);
    component.setIcon("repair_tools");
    component.setMaxStackSize(1);
    component.setCustomComponent("minecraft:can_destroy_in_creative", false);
    component.setCustomComponent("minecraft:hand_equipped", true);
    return component;
  }
}

export { RepairTools };
