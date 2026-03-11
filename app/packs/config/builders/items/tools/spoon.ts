import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

class SpoonItem extends ItemBuilder {
  public override basePath: string = "tools/spoon.json";
  public override name: string = "spoon";

  public override getIdentifier(): string {
    return "kisu:spoon";
  }

  public override getCategory(): ItemCategory {
    return ItemCategory.Equipment;
  }

  public override getComponents(): ItemComponents {
    const component = new ItemComponents()
      .setIcon("spoon")
      .setDisplayName("ช้อน")
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

export { SpoonItem };
