/**
 * {
	"format_version": "1.20.80",
	"minecraft:item": {
		"description": {
			"identifier": "kisu:wallet",
			"menu_category": {
				"category": "equipment"
			}
		},
		"components": {
			"minecraft:icon": "wallet",
			"minecraft:display_name": {
				"value": "กระเป๋าสตางค์"
			},
			"minecraft:max_stack_size": 1,
			"minecraft:tags": {
				"tags": [
					"others",
					"wallet"
				]
			}
		}
	}
 }
 */

import { ItemBuilder, ItemCategory, ItemComponents } from "@axeth/builder";

class WalletItem extends ItemBuilder {
  public override basePath: string = "others/wallet.json";
  public override name: string = "wallet";

  public override getIdentifier(): string {
    return "kisu:wallet";
  }

  public override getCategory(): ItemCategory {
    return ItemCategory.Equipment;
  }

  public override getComponents(): ItemComponents {
    const component = new ItemComponents()
      .setIcon("wallet")
      .setDisplayName("กระเป๋าเงิน")
      .setMaxStackSize(1)
      .setTags(
        [
          "others",
          "wallet",
        ],
      );

    return component;
  }
}

export { WalletItem };
