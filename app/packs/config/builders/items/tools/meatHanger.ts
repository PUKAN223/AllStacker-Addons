/**
 * {
   "format_version": "1.21.0",
   "minecraft:item": {
     "description": {
       "identifier": "hams:ed_meat_hanger",
       "category": "items"
     },
     "components": {
       "minecraft:max_stack_size": 64,
       "minecraft:icon": "meat_hanger",
       "minecraft:on_use_on": {
         "on_use_on": {
           "event": "hams:place_sound"
         }
       },
       "minecraft:entity_placer": {
         "entity": "hams:ed_meat_hanger"
       },
       "minecraft:display_name": {
         "value": "item.hams:ed_meat_hanger.name"
       },
       "minecraft:creative_category": {
         "parent": "itemGroup.name.items"
       }
     },
     "events": {
       "hams:place_sound": {
         "run_command": {
           "command": ["playsound dig.stone @a ~~~"]
         }
       }
     }
   }
 }

 */

import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

class MeatHangerItem extends ItemBuilder {
  public override basePath: string = "tools/meat_hanger.json";
  public override name: string = "meat_hanger";
  public override getIdentifier(): string {
    return "hams:ed_meat_hanger";
  }

  public override getCategory(): ItemCategory {
    return ItemCategory.Equipment;
  }

  public override getComponents(): ItemComponents {
    const component = super.getComponents();
    component.setMaxStackSize(64);
    component.setCustomComponent("minecraft:entity_placer", {
      "entity": "hams:ed_meat_hanger",
    });
    component.setCustomComponent("minecraft:creative_category", {
      "parent": "itemGroup.name.items",
    });
    component.setDisplayName(`ที่ห้อย`);
    component.setIcon("meat_hanger");

    return component;
  }
}

export { MeatHangerItem };
