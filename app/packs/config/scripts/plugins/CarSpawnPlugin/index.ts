import { PluginBase, type PluginSettingOptions } from "@axeth/api";
import { Player } from "@minecraft/server";
import { CarSpawnManagers } from "./class/CarSpawnManagers.ts";
import { CarTypeDataManager } from "./class/CarTypeDataManager.ts";

class CarSpawnPlugin extends PluginBase {
  public override name: string = "CarSpawnPlugin";
  public override version: string = "1.0.0";
  public override icon: string = "textures/icon/rx115";

  private carSpawnManagers!: CarSpawnManagers;
  private carTypeDataManager!: CarTypeDataManager;

  public override onLoad(): void {
    this.carTypeDataManager = CarTypeDataManager.initialize(this);
    this.carSpawnManagers = CarSpawnManagers.initialize(
      this,
      this.carTypeDataManager,
    );

    this.registerDefaultCars();
    this.onCarSpawnNpcInteract();
  }

  private registerDefaultCars(): void {
    this.carTypeDataManager.registerCarType({
      id: "rx115_white",
      name: "RX115 White",
      typeId: "rx115:white",
      icon: "textures/icon/rx115",
      ownershipTags: ["car:rx115_white"],
    });

    this.carTypeDataManager.registerCarType({
      id: "bicycle",
      name: "จักรยาน",
      typeId: "kisu:bicycle",
      icon: "textures/icon/bicycle",
      ownershipTags: ["car:bicycle"],
    });

    this.carTypeDataManager.registerCarType({
      id: "car_200",
      name: "Beyon DA",
      typeId: "nitric_ve:beyon_da",
      icon: "textures/nitric/ve/items/car_200",
      ownershipTags: ["car:car_200"],
    });

    this.carTypeDataManager.registerCarType({
      id: "car_488",
      name: "Fenzi 84",
      typeId: "nitric_ve:fenzi_84",
      icon: "textures/nitric/ve/items/car_488",
      ownershipTags: ["car:car_488"],
    });

    this.carTypeDataManager.registerCarType({
      id: "car_c8",
      name: "Court 8",
      typeId: "nitric_ve:court_8",
      icon: "textures/nitric/ve/items/car_c8",
      ownershipTags: ["car:car_c8"],
    });

    this.carTypeDataManager.registerCarType({
      id: "car_gt",
      name: "Fender GT",
      typeId: "nitric_ve:fender_gt",
      icon: "textures/nitric/ve/items/car_gt",
      ownershipTags: ["car:car_gt"],
    });

    this.carTypeDataManager.registerCarType({
      id: "car_mfgt",
      name: "Murky GT",
      typeId: "nitric_ve:murky_gt",
      icon: "textures/nitric/ve/items/car_mfgt",
      ownershipTags: ["car:car_mfgt"],
    });

    this.carTypeDataManager.registerCarType({
      id: "car_mk",
      name: "Sunny M4",
      typeId: "nitric_ve:sunny_m4",
      icon: "textures/nitric/ve/items/car_mk",
      ownershipTags: ["car:car_mk"],
    });

    this.carTypeDataManager.registerCarType({
      id: "car_nsx",
      name: "Honey XS",
      typeId: "nitric_ve:honey_xs",
      icon: "textures/nitric/ve/items/car_nsx",
      ownershipTags: ["car:car_nsx"],
    });

    this.carTypeDataManager.registerCarType({
      id: "car_rtg",
      name: "Sunset GT",
      typeId: "nitric_ve:sunset_gt",
      icon: "textures/nitric/ve/items/car_rtg",
      ownershipTags: ["car:car_rtg"],
    });

    this.carTypeDataManager.registerCarType({
      id: "car_sky",
      name: "Moonlight",
      typeId: "nitric_ve:moonlight",
      icon: "textures/nitric/ve/items/car_sky",
      ownershipTags: ["car:car_sky"],
    });

    this.carTypeDataManager.registerCarType({
      id: "car_storm",
      name: "Storm",
      typeId: "nitric_ve:storm",
      icon: "textures/nitric/ve/items/car_storm",
      ownershipTags: ["car:car_storm"],
    });

    this.carTypeDataManager.registerCarType({
      id: "car_type_r",
      name: "Bivac R",
      typeId: "nitric_ve:bivac_r",
      icon: "textures/nitric/ve/items/car_type_r",
      ownershipTags: ["car:car_type_r"],
    });

    this.carTypeDataManager.registerCarType({
      id: "car_vm",
      name: "B EM4",
      typeId: "nitric_ve:b_em4",
      icon: "textures/nitric/ve/items/car_vm",
      ownershipTags: ["car:car_vm"],
    });

    this.carTypeDataManager.registerCarType({
      id: "car_wagon",
      name: "G Waltz",
      typeId: "nitric_ve:g_waltz",
      icon: "textures/nitric/ve/items/car_wagon",
      ownershipTags: ["car:car_wagon"],
    });

    this.carTypeDataManager.registerCarType({
      id: "car_x570",
      name: "Menka S75",
      typeId: "nitric_ve:menka_s75",
      icon: "textures/nitric/ve/items/car_x570",
      ownershipTags: ["car:car_x570"],
    });

    this.carTypeDataManager.registerCarType({
      id: "car_x7",
      name: "Azza X77",
      typeId: "nitric_ve:azza_x77",
      icon: "textures/nitric/ve/items/car_x7",
      ownershipTags: ["car:car_x7"],
    });

    const db = this.carTypeDataManager.database;
    if (!db.spawns["default"]) {
      this.carTypeDataManager.setSpawnProfile("default", []);
    }
  }

  private onCarSpawnNpcInteract(): void {
    this.events.on("BeforePlayerInteractWithEntity", async (ev) => {
      if (!this.carSpawnManagers.isNpcCarSpawn(ev.target)) return;
      if (ev.player.isSneaking && ev.player.hasTag("admin")) return;

      ev.cancel = true;
      await this.system.waitTicks(1);

      this.carSpawnManagers.openCarSpawnMenu(ev.player, ev.target);
    });
  }

  public override getAdvancedSettings(
    pl: Player,
    _plugin: PluginBase,
  ): (() => void) | null {
    return this.carTypeDataManager.showAdvancedSettings.bind(
      this.carTypeDataManager,
      pl,
    );
  }

  public override getSettings(): PluginSettingOptions {
    return {
      carSpawnData: {
        type: "string",
        canUserModify: false,
        default: '{"cars":{},"spawns":{}}',
        description:
          "Data for cars and car_spawn profiles. This should not be modified directly by users.",
      },
      carRespawnFee: {
        type: "number",
        canUserModify: true,
        default: 15000,
        maxValue: 100000,
        description: "ค่าธรรมเนียมเรียกรถซ้ำ (หลังเคยเรียกรถไปแล้วอย่างน้อย 1 ครั้ง)",
      },
      carRespawnFeeScore: {
        type: "string",
        canUserModify: true,
        default: "money",
        description: "ชื่อสกอร์บอร์ดที่ใช้หักเงินเวลาเรียกรถซ้ำ",
      },
    };
  }
}

export { CarSpawnPlugin };
