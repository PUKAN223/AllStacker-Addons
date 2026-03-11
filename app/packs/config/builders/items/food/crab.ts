import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

class CrabItem extends ItemBuilder {
  public override basePath: string = `food/crab.json`;
  public override name: string = "crab";

  public override getIdentifier(): string {
    return `kisu:crab`;
  }

  public override getCategory(): ItemCategory {
    return ItemCategory.Nature;
  }

  public override getComponents(): ItemComponents {
    const components = new ItemComponents()
      .setIcon(`item_crab`)
      .setMaxStackSize(10)
      .setFood({
        can_always_eat: true,
        nutrition: 1,
        saturation_modifier: 1,
      })
      .setDisplayName(`ปู`)
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

export { CrabItem };
