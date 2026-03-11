import { PluginBase, type PluginSettingOptions } from "@axeth/api";
import { AnimalFarmManager } from "./class/AnimalFarmManager.ts";
import { Player } from "@minecraft/server";

class AnimalFarmPlugin extends PluginBase {
  public override name: string = "AnimalFarmPlugin";
  public override icon: string = "textures/items/spawn_eggs/spawn_egg_sheep";
  public override version: string = "1.0.0";

  private animalFarmManager: AnimalFarmManager = AnimalFarmManager.initialize(
    this,
  );

  public override onLoad(): void | Promise<void> {
    
    this.animalFarmManager.registerSpawnEgg(
      `hams:ed_cow_spawn_egg`,
      {
        animalType: "hams:ed_cow",
        grownTime: 200,
        icon: "textures/items/spawn_egg/cow/cow1",
        drop: [
          { type: "hams:ed_cow1_spawn_egg", amount: [1, 1] },
        ],
      },
    );

    this.animalFarmManager.registerSpawnEgg(
      `hams:ed_goat_spawn_egg`,
      {
        animalType: "hams:ed_goat",
        grownTime: 200,
        icon: "textures/items/spawn_egg/goat/goat1",
        drop: [
          { type: "hams:ed_goat1_spawn_egg", amount: [1, 1] },
        ],
      },
    );
  }

  public override getAdvancedSettings(
    pl: Player,
    _plugin: PluginBase,
  ): (() => void) | null {
    return () => {
      this.animalFarmManager.showAnimalArea(pl);
    };
  }

  public override getSettings(): PluginSettingOptions {
    return {
      "animalsData": {
        canUserModify: false,
        default: "[]",
        description: "Data of animals",
        type: "string",
      },
      "animalsArea": {
        canUserModify: false,
        default: "{}",
        description: "Area of animals",
        type: "string",
      },
    };
  }
}

export { AnimalFarmPlugin };
