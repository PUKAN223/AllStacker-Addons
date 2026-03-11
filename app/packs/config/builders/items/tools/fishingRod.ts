/**
 * {
   "format_version": "1.20.80",
   "minecraft:item": {
     "description": {
       "identifier": "kisu:fishing_rod",
       "menu_category": {
         "category": "equipment"
       }
     },
     "components": {
       "minecraft:max_stack_size": 1,
       "minecraft:icon": {
         "textures": {
           "default": "fishing_rod"
         }
       },
       "minecraft:display_name": {
         "value": "เบ็ดตกปลา"
       },
       "minecraft:can_destroy_in_creative": false,
       "minecraft:durability": {
         "max_durability": 150,
         "damage_chance": {
           "min": 0,
           "max": 1
         }
       },
       "minecraft:cooldown": {
         "category": "kisu:rod",
         "duration": 0
       },
       "minecraft:use_modifiers": {
         "movement_modifier": 1,
         "use_duration": 999999
       },
       "minecraft:use_animation": "none",
       "minecraft:hand_equipped": true
     }
   }
 }
 */

import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

class FishingRodItem extends ItemBuilder {
  public override basePath: string = "tools/fishing_rod.json";
  public override name: string = "fishing_rod";

  public override getIdentifier(): string {
    return "kisu:fishing_rod";
  }

  public override getCategory(): ItemCategory {
    return ItemCategory.Equipment;
  }

  public override getComponents(): ItemComponents {
    const component = new ItemComponents()
      .setMaxStackSize(1)
      .setIcon("fishing_rod")
      .setDisplayName("เบ็ดตกปลา")
      .setCustomComponent("minecraft:can_destroy_in_creative", false)
      .setCustomComponent("minecraft:durability", {
        max_durability: 150,
        damage_chance: {
          min: 0,
          max: 1,
        },
      })
      .setCustomComponent("minecraft:cooldown", {
        category: "kisu:rod",
        duration: 0,
      })
      .setUseModifiers({
        movement_modifier: 1,
        use_duration: 999999,
      })
      .setUseAnimation("none")
      .setCustomComponent("minecraft:hand_equipped", true);

    return component;
  }
}

export { FishingRodItem };
