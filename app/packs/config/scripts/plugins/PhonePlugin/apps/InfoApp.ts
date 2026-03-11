import { IActionForm, IModalForm } from "@axeth/api";
import { AppFormType, BasePhoneApp } from "../class/BasePhoneApp.ts";
import { Player } from "@minecraft/server";

class InfoApp extends BasePhoneApp {
  public override name: string = `ข้อมูล`;
  public override icon: string = "textures/icons_apps/info";
  public override formType: AppFormType = AppFormType.ActionForm;

  private readonly scores = {
    moneyScore: "money",
    redMoneyScore: "rmoney",
    coinScore: "ktcoin",
  };

  public override getAppHome(
    pl: Player,
    previosForm: (pl: Player) => void,
  ): IActionForm | IModalForm {
    const form = super.getAppHome(pl, previosForm);

    if (form instanceof IModalForm) return form;

    const allPlayers = this.plugin.world.getPlayers();
    const countGovernment = {
      medic: allPlayers.filter((x) => x.hasTag("medic")).length,
      police: allPlayers.filter((x) => x.hasTag("police")).length,
      grab: allPlayers.filter((x) => x.hasTag("grab")).length,
      online: allPlayers.length,
    };

    form.setBody(`\n\n
    §eสวัสดี, §7${pl.name}
    §7ข้อมูล:
     §aเงิน§r§f : ${this.getScore(pl, this.scores.moneyScore)} บาท
     §cเงินเเดง§r§f : ${this.getScore(pl, this.scores.redMoneyScore)}
     §bเคที§6คอยน์ §f: ${this.getScore(pl, this.scores.coinScore)}

  §7§r§f : ${countGovernment.online} | §7§r§f : ${countGovernment.medic} | §7§r§f : ${countGovernment.police} | §7§r§f : ${countGovernment.grab}`);

    form.addButton(`เเสดงข้อมูล`, "textures/icons_apps/info", () => {
      pl.sendMessage(
        `
  §eสวัสดี, §7${pl.name}
  §7ข้อมูล:
   §aเงิน§r§f : ${this.getScore(pl, this.scores.moneyScore)} บาท
   §cเงินเเดง§r§f : ${this.getScore(pl, this.scores.redMoneyScore)}
   §bเคที§6คอยน์ §f: ${this.getScore(pl, this.scores.coinScore)}
      `,
      );
    });
    form.addButton("ย้อนกลับ", "textures/icons_apps/back", () => previosForm(pl));
    return form;
  }

  private getScore(pl: Player, score: string) {
    const obj = this.plugin.world.scoreboard.getObjective(score);
    if (!obj) return 0;
    return obj.getScore(pl) ?? 0;
  }
}

export { InfoApp };
