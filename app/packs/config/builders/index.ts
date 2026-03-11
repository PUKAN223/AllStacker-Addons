import { AxethBuilder } from "@axeth/builder";
import { WalletItem } from "./items/others/wallet.ts";
import { FishingRodItem } from "./items/tools/fishingRod.ts";
import { IronSickleItem } from "./items/tools/ironSickle.ts";
import { HandCuffItem } from "./items/tools/handCuff.ts";
import { SmartphoneItem } from "./items/smartphone.ts";
import { CropItemBuilder } from "./items/crops/crops.ts";
import { ShrimpItem } from "./items/food/shrimp.ts";
import { CrabItem } from "./items/food/crab.ts";
import { ButcherKnifeItem } from "./items/tools/butcherKnife.ts";
import { MeatHangerItem } from "./items/tools/meatHanger.ts";
import { GasItem } from "./items/tools/gas.ts";
import { RepairTools } from "./items/tools/repairTool.ts";
import { ShovelItem } from "./items/tools/shovel.ts";
import { FoodItemBuilder } from "./items/food/food.ts";
import { SpoonItem } from "./items/tools/spoon.ts";

const crops = {
  "lettuce": {
    displayName: "ใบผักกาดหอม",
  },
  "banana": {
    displayName: "กล้วย",
  },
  "basil": {
    displayName: "ใบโหระพา",
  },
  "broccoli": {
    displayName: "บรอกโคลี",
  },
  "cabbage": {
    displayName: "ใบกะหล่ำปลี",
  },
  "cassava": {
    displayName: "มัน",
  },
  "corn": {
    displayName: "ข้าวโพด",
  },
  "onion": {
    displayName: "หอมเเดง",
  },
  "pepper": {
    displayName: "พริก",
  },
  "papaya": {
    displayName: "มะละกอ",
  },
  "lime": {
    displayName: "มะนาว",
  },
};

const food = {
  "chicken_grill": {
    displayName: "ไก่ย่าง",
    nutrition: 2,
  },
  "kangkaewwan": {
    displayName: "เเกงเขียวหวาน",
    nutrition: 3,
  },
  "kawjee": {
    displayName: "ข้าวจี่",
    nutrition: 2,
  },
  "larb": {
    displayName: "ลาบ",
    nutrition: 3,
  },
  "namprik": {
    displayName: "น้ำพริก",
    nutrition: 2,
  },
  "namtok": {
    displayName: "น้ำตก",
    nutrition: 3,
  },
  "somtam": {
    displayName: "ส้มตำ",
    nutrition: 3,
  },
  "sticky_rice": {
    displayName: "ข้าวเหนียว",
    nutrition: 2,
  },
  "tomyam": {
    displayName: "แจ่วบอง",
    nutrition: 3,
  },
};

class Builder extends AxethBuilder {
  public override onBuild() {
    Object.keys(crops).forEach((name) => {
      const crop = CropItemBuilder(
        name,
        crops[name as keyof typeof crops].displayName,
      );
      this.itemBuilderManager.registerItemBuilder(crop);
    });

    Object.keys(food).forEach((name) => {
      const item = FoodItemBuilder(
        name,
        food[name as keyof typeof food].displayName,
        food[name as keyof typeof food].nutrition,
      );
      this.itemBuilderManager.registerItemBuilder(item);
    });

    this.itemBuilderManager.registerItemBuilder(WalletItem);
    this.itemBuilderManager.registerItemBuilder(FishingRodItem);
    this.itemBuilderManager.registerItemBuilder(IronSickleItem);
    this.itemBuilderManager.registerItemBuilder(HandCuffItem);
    this.itemBuilderManager.registerItemBuilder(SmartphoneItem);
    this.itemBuilderManager.registerItemBuilder(ShrimpItem);
    this.itemBuilderManager.registerItemBuilder(CrabItem);
    this.itemBuilderManager.registerItemBuilder(ButcherKnifeItem);
    this.itemBuilderManager.registerItemBuilder(MeatHangerItem);
    this.itemBuilderManager.registerItemBuilder(GasItem);
    this.itemBuilderManager.registerItemBuilder(RepairTools);
    this.itemBuilderManager.registerItemBuilder(ShovelItem);
    this.itemBuilderManager.registerItemBuilder(SpoonItem);
  }
}

export default Builder;
