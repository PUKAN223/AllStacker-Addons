import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

function CropItemBuilder(
  name: string,
  displayName: string,
) {
  class Crops extends ItemBuilder {
    public override basePath: string = `crops/${name}.json`;
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
        .setDisplayName(displayName)
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
  return Crops;
}

export { CropItemBuilder };
