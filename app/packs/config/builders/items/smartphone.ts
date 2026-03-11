/**
 * {
    "format_version": "1.20.50",
    "minecraft:item": {
        "description": {
            "identifier": "id:iphone",
            "menu_category": {
                "category": "equipment"
            }
        },
        "components": {
            "minecraft:icon": "iphone",
            "minecraft:max_stack_size": 1,
            "minecraft:damage": {
                "value": 1
            },
            "minecraft:can_destroy_in_creative": {
                "value": false
            },
            "minecraft:display_name": {
                "value": "iPhone"
            }
        }
    }
}
 */

import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

class SmartphoneItem extends ItemBuilder {
  public override basePath: string = "smartphone.json";
  public override name: string = "smartphone";

  public override getIdentifier(): string {
    return "kisu:phone";
  }

  public override getCategory(): ItemCategory {
    return ItemCategory.Equipment;
  }

  public override getComponents(): ItemComponents {
    const component = new ItemComponents()
      .setIcon("smartphone")
      .setMaxStackSize(1)
      .setCustomComponent("minecraft:damage", {
        value: 1,
      })
      .setCustomComponent("minecraft:can_destroy_in_creative", {
        value: false,
      })
      .setDisplayName("โทรศัพท์");
    return component;
  }
}

export { SmartphoneItem };
