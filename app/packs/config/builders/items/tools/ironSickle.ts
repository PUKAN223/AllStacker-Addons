/**
 * {
	"format_version": "1.20.80",
	"minecraft:item": {
		"description": {
			"identifier": "kisu:iron_sickle",
			"menu_category": {
				"category": "equipment"
			}
		},
		"components": {
			"minecraft:icon": "iron_sickle",
			"minecraft:display_name": {
				"value": "เคียว"
			},
			"minecraft:durability": {
				"max_durability": 100
			},
			"minecraft:max_stack_size": 1,
			"minecraft:tags": {
				"tags": [
					"tool",
					"sickle"
				]
			}
		}
	}
 }
 */

import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

class IronSickleItem extends ItemBuilder {
  public override basePath: string = "tools/iron_sickle.json";
  public override name: string = "iron_sickle";

  public override getIdentifier(): string {
    return "kisu:iron_sickle";
  }

  public override getCategory(): ItemCategory {
    return ItemCategory.Equipment;
  }

  public override getComponents(): ItemComponents {
    const component = new ItemComponents()
      .setIcon("iron_sickle")
      .setDisplayName("เคียว")
      .setCustomComponent("minecraft:durability", {
        max_durability: 100,
      })
      .setMaxStackSize(1)
      .setTags([
        "tool",
        "sickle",
      ])
      .setCustomComponent("minecraft:hand_equipped", {
        value: true,
      });

    return component;
  }
}

export { IronSickleItem };
