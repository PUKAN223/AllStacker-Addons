import { ItemCategory } from  "@packages/builder/src/types/ItemCategory.ts";
import { ItemComponents } from  "@packages/builder/src/class/components/ItemComponents.ts";

class ItemBuilder {
  public basePath = "";
  public name = "";
  constructor() {
  }

  public getFormatVersion(): string {
    return "1.21.80";
  }

  public getGroupIdentifier(): string {
    return "";
  }

  public getIdentifier(): string {
    return "";
  }

  public getCategory(): ItemCategory {
    return ItemCategory.None;
  }

  public getComponents(): ItemComponents {
    return new ItemComponents();
  }

  public toJson(): Record<string, unknown> {
    const json = {
      format_version: this.getFormatVersion(),
      "minecraft:item": {
        description: {
          identifier: this.getIdentifier(),
          menu_category: {
            category: this.getCategory(),
            ...(this.getGroupIdentifier().length > 0 && {
              group: this.getGroupIdentifier(),
            }),
          },
        },
        components: this.getComponents().toJSON(),
      },
    };
    return json;
  }
}

export { ItemBuilder };
