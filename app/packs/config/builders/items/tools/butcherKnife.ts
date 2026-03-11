import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

/**
{
  "format_version": "1.21.0",
  "minecraft:item": {
    "description": {
      "identifier": "hams:ed_butcher_knife",
      "category": "items"
    },
    "components": {
      "minecraft:hand_equipped": true,
      "minecraft:max_stack_size": 1,
      "minecraft:damage": 6,
      "minecraft:icon": "butcher_knife",
      "minecraft:display_name": {
        "value": "item.hams:ed_butcher_knife.name"
      },
      "minecraft:creative_category": {
        "parent": "itemGroup.name.items"
      }
    },
    "events": {}
  }
}
*/
class ButcherKnifeItem extends ItemBuilder {
  public override basePath: string = "tools/butcher_knife.json";
  public override name: string = "butcher_knife";
  public override getIdentifier(): string {
    return "hams:ed_butcher_knife";
  }

  public override getCategory(): ItemCategory {
    return ItemCategory.Equipment;
  }
  
  public override getComponents(): ItemComponents {
    const component = super.getComponents();
    component.setCustomComponent("minecraft:can_destroy_in_creative", false);
    component.setCustomComponent("minecraft:hand_equipped", true);
    component.setMaxStackSize(1);
    component.setCustomComponent("minecraft:damage", 2);
    component.setIcon("butcher_knife");
    component.setDisplayName(`มีดสับ`);
    component.setCustomComponent("minecraft:creative_category", {
      "parent": "itemGroup.name.items",
    });
    component.setCustomComponent("minecraft:durability", {
      "max_durability": 100,
      "damage_chance": {
        "max": 1,
        "min": 1,
      },
    });
    return component;
  }
}

export { ButcherKnifeItem };
