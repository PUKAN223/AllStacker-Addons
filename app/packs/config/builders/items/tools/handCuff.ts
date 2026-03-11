/**
 * {
   "format_version": "1.20.80",
   "minecraft:item": {
     "description": {
       "identifier": "kisu:handcuff",
       "menu_category": {
         "category": "equipment"
       }
     },
     "components": {
       "minecraft:max_stack_size": 1,
       "minecraft:icon": {
         "textures": {
           "default": "handcuff"
         }
       },
       "minecraft:display_name": {
         "value": "กุญแจมือ"
       },
       "minecraft:can_destroy_in_creative": false,
       "minecraft:hand_equipped": true
     }
   }
 }
 */

import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

class HandCuffItem extends ItemBuilder {
  public override basePath: string = "tools/handcuff.json";
  public override name: string = "handcuff";

  public override getIdentifier(): string {
    return "kisu:handcuff";
  }

  public override getCategory(): ItemCategory {
    return ItemCategory.Equipment;
  }

  public override getComponents(): ItemComponents {
    const component = new ItemComponents()
      .setMaxStackSize(1)
      .setIcon("handcuff")
      .setDisplayName("กุญแจมือ")
      .setCustomComponent("minecraft:can_destroy_in_creative", false)
      .setCustomComponent("minecraft:hand_equipped", true);

    return component;
  }
}

export { HandCuffItem };
