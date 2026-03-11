import { EntityScaleComponent, Player } from "@minecraft/server";
import { AppFormType, BasePhoneApp } from "../class/BasePhoneApp.ts";
import { IActionForm } from "@axeth/api";

class ScaleApp extends BasePhoneApp {
  public override name: string = "ปรับขนาด";
  public override icon: string = "textures/icons_apps/effect";
  public override formType: AppFormType = AppFormType.ModalForm;

  private readonly scaleList = {
    "เด็ก": 0.7,
    "เตี้ย": 0.9,
    "ปกติ": 1,
    "ใหญ่": 1.1,
  };

  public override getAppHome(pl: Player, previosForm: (pl: Player) => void) {
    const forms = super.getAppHome(pl, previosForm);

    if (forms instanceof IActionForm) return forms;
    const currentScale = this.getScale(pl);
    forms.addLabel(
      `\n  §fขนาดปัจจุบัน §c${this.getScaleName(currentScale)}`,
    );
    forms.addSlider({
      label: "  §0ขนาด",
      minimumValue: 1,
      maximumValue: Object.keys(this.scaleList).length,
      valueStep: 1,
      defaultValue:
        Object.keys(this.scaleList).indexOf(this.getScaleName(currentScale)) +
        1,
    }, (value) => {
      const scaleValue = Object.values(this.scaleList)[value - 1];
      this.setScale(pl, scaleValue);
    });
    return forms;
  }

  private getScale(pl: Player): number {
    const scale = pl.getComponent(EntityScaleComponent.componentId)?.value;
    return scale ?? 1;
  }

  private getScaleName(value: number): string {
    return Object.entries(this.scaleList).find(([_, scale]) =>
      scale.toFixed(2) === value.toFixed(2)
    )
      ?.[0] ?? "";
  }

  private setScale(pl: Player, value: number): void {
    //1.2 - kisu:size_1_2
    //1 - kisu:size_1_0
    //0.9 - kisu:size_0_9
    console.warn(value);
    const eventTrig = "kisu:size_" + value.toString().replace(".", "_");
    pl.triggerEvent(eventTrig);
  }
}

export { ScaleApp };
