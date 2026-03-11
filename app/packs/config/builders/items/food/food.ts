import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

function FoodItemBuilder(
  name: string,
  displayName: string,
  nutrition: number,
) {
  class foodItem extends ItemBuilder {
    public override basePath: string = `food/${name}.json`;
    public override name: string = name;

    public override getIdentifier(): string {
      return `kisu:${name}`;
    }

    public override getCategory(): ItemCategory {
      return ItemCategory.Nature;
    }

    public override getComponents(): ItemComponents {
      const components = new ItemComponents()
        .setIcon(`item_${name}`)
        .setMaxStackSize(10)
        .setFood({
          can_always_eat: false,
          nutrition: nutrition,
          saturation_modifier: 1,
        })
        .setDisplayName(displayName)
        .setUseModifiers({
          use_duration: 2,
          movement_modifier: 0.4,
        })
        .setUseAnimation("eat")
        .setTags(
          [
            "food",
            "nature",
            name,
          ],
        );
      return components;
    }
  }

  return foodItem;
}

export { FoodItemBuilder };
