import { IActionForm, IModalForm } from "@axeth/api";
import { BasePhoneApp } from "../class/BasePhoneApp.ts";
import { Player } from "@minecraft/server";
import { PlayerUtils } from "../../../../../../../packages/api/src/global/Player.ts";

class GpsApp extends BasePhoneApp {
  public override name: string = "นำทาง";
  public override icon: string = "textures/icons_apps/weather.png";

  private gpsList = {
    "ฟาร์ม": {
      "สวนกล้วย": { x: 329, y: 76, z: -742 },
      "ฟาร์มสัตว์": { x: -376, y: 65, z: -695 },
      "นาข้าว": { x: -666, y: 65, z: -57 },
      "เหมือง": { x: 242, y: 65, z: 667 },
      "สวนมัน": { x: 616, y: 74, z: 10 },
      "สวนอ้อย": { x: -339, y: 108, z: 601 },
    },
    "สถานที่": {
      "สวนดอกไม้": { x: -535, y: 65, z: 158 },
      "สน.": { x: -665, y: 65, z: 260 },
      "รพ": { x: -81, y: 65, z: 272 },
      "เรเบล": { x: 678, y: 65, z: 493 },
      "ตลาด": { x: -33, y: 64, z: 39 },
      "วัด": { x: 351, y: 68, z: -188 },
      "เวที": { x: 51, y: 129, z: -348 },
      "ที่ตกปลา": { x: 727, y: 65, z: -464 },
    },
  };

  public override getAppHome(
    pl: Player,
    previosForm: (pl: Player) => void,
  ): IActionForm | IModalForm {
    const gpsForm = super.getAppHome(pl, previosForm);
    if (gpsForm instanceof IModalForm) return gpsForm;

    //if player already have direction: tag
    //
    const tags = pl.getTags().find((x) => x.startsWith("direction:"));
    if (tags) {
      const [_, name, _location] = tags.split(":");

      gpsForm.setBody(
        `\n\n§8คุณกำลังนำทางไปที่ §6${name}\n§8คุณต้องการ§cยกเลิก§8หรือไม่`,
      );
      gpsForm.addButton(`§cยกเลิก`, `textures/ui/realms_red_x`, () => {
        pl.removeTag(`direction:${name}:${_location}`);
        PlayerUtils.stopTopbar(pl);
        PlayerUtils.sendToast(
          pl,
          ``,
          `ยกเลิกนำทางเเล้ว`,
          `textures/ui/realms_red_x`,
        );
        gpsForm.back(pl);
      });
      gpsForm.addButton(`§fกลับ`, `textures/icons_apps/back`, () => {
        gpsForm.back(pl);
      });

      return gpsForm;
    }

    for (const categories of Object.keys(this.gpsList)) {
      gpsForm.addButton(
        categories,
        `textures/icons_apps/app_store/bank_purchased`,
        () => {
          this.showGpsList(
            pl,
            this.gpsList[categories as keyof typeof this.gpsList],
          );
        },
      );
    }
    return gpsForm;
  }

  private showGpsList(
    pl: Player,
    gps: Record<string, { x: number; y: number; z: number }>,
  ) {
    const gpsForm = super.getAppHome(pl, () => {}) as IActionForm;
    for (const [name, coords] of Object.entries(gps)) {
      gpsForm.addButton(
        name,
        `textures/icons_apps/app_store/bank_purchased`,
        () => {
          pl.addTag(`direction:${name}:${coords.x},${coords.y},${coords.z}`);
          PlayerUtils.sendToast(pl, ``, `กำลังนำทางไป ${name}`);
        },
      );
    }
    gpsForm.show(pl);
  }
}

export { GpsApp };
