import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

class ShrimpItem extends ItemBuilder {
  public override basePath: string = `food/shrimp.json`;
  public override name: string = "shrimp";

  public override getIdentifier(): string {
    return `kisu:shrimp`;
  }

  public override getCategory(): ItemCategory {
    return ItemCategory.Nature;
  }

  public override getComponents(): ItemComponents {
    const components = new ItemComponents()
      .setIcon(`item_shrimp`)
      .setMaxStackSize(10)
      .setFood({
        can_always_eat: true,
        nutrition: 1,
        saturation_modifier: 1,
      })
      .setDisplayName(`กุ้ง`)
      .setUseModifiers({
        use_duration: 2,
        movement_modifier: 0.4,
      })
      .setUseAnimation("eat")
      .setTags(
        [
          "food",
          "nature",
          this.name,
        ],
      );
    return components;
  }
}

export { ShrimpItem };
