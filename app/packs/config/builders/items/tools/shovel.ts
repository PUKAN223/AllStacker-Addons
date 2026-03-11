import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

class ShovelItem extends ItemBuilder {
  public override basePath: string = "tools/shovel.json";
  public override name: string = "shovel";

  public override getIdentifier(): string {
    return "kisu:shovel";
  }

  public override getCategory(): ItemCategory {
    return ItemCategory.Equipment;
  }

  public override getComponents(): ItemComponents {
    const component = new ItemComponents()
      .setIcon("shovel_items")
      .setDisplayName("พลั่วขุด")
      .setCustomComponent("minecraft:durability", {
        max_durability: 100,
      })
      .setMaxStackSize(1)
      .setTags([
        "tool",
      ])
      .setCustomComponent("minecraft:hand_equipped", {
        value: true,
      });

    return component;
  }
}

export { ShovelItem };
