import { IActionForm, IModalForm, PlayerUtils } from "@axeth/api";
import { AppFormType, BasePhoneApp } from "../class/BasePhoneApp.ts";
import { Player } from "@minecraft/server";
import { BillDataManager } from "../class/BillDataManager.ts";

class BankApp extends BasePhoneApp {
  public override name: string = "ธนาคาร";
  public override icon: string = "textures/icons_apps/bank.png";
  public override formType: AppFormType = AppFormType.ActionForm;

  private billDataManagers = new BillDataManager(this.plugin);

  private governmentTags = [
    "police",
    "medic",
    "admin",
  ];

  public override getAppHome(
    pl: Player,
    previosForm: (pl: Player) => void,
  ): IActionForm | IModalForm {
    const bankForm = super.getAppHome(pl, previosForm);
    const bills = this.billDataManagers.getBillData(pl.id);
    if (bankForm instanceof IActionForm) {
      bankForm.addButton(
        `รายการบิล ${bills.length} รายการ`,
        "textures/icons_apps/app_store/bank_purchased",
      );

      if (bills.length === 0) {
        bankForm.addButton(
          `§cไม่มีรายการบิล`,
          "textures/icons_apps/app_store/bank_purchased",
        );
      }

      for (const bill of bills) {
        bankForm.addButton(
          `§fบิล #${bill.id} \n§a${bill.amount} §7บาท`,
          "textures/icons_apps/app_store/bank_purchased",
          () => {
            const obj = this.plugin.world.scoreboard.getObjective("money");
            if (obj) {
              // console.log(obj.getScore(pl), bill.amount);
              if (obj.getScore(pl)! >= bill.amount) {
                obj.addScore(pl, -bill.amount);
                PlayerUtils.sendToast(
                  pl,
                  ``,
                  "จ่ายบิลสำเร็จ\n" + `คุณได้จ่ายบิล ${bill.amount} บาท`,
                );
                this.billDataManagers.removeBill(pl.id, bill.id);

                this.plugin.world.getAllPlayers().filter((p) =>
                  this.governmentTags.some((x) => p.hasTag(x))
                ).forEach((p) => {
                  PlayerUtils.sendToast(
                    p,
                    ``,
                    `${p.name} จ่ายบิลเเล้ว ${bill.amount} บาท\b#${bill.id}`,
                  );
                });
              } else {
                PlayerUtils.sendToast(
                  pl,
                  "เงินไม่พอ",
                  "ไม่สามารถจ่ายบิลได้เนื่องจากเงินไม่พอ",
                );
              }
            }
          },
        );
      }
    }
    return bankForm;
  }
}

export { BankApp };

/**
 *
 private showPhoneUI(player: Player): void {
   const phone = IActionForm.createForm("title.smartphone_home");
   phone.setBody(`มือถือ ${" ".repeat(15)} §a100%%§r`);
   phone.addButton("§fนำทาง", "textures/icons_apps/weather.png");
   phone.addButton("§fธนาคาร", "textures/icons_apps/bank.png");
   phone.addButton(
     "§fเเชท",
     "textures/icons_apps/app_store/discraft_purchase.png",
   );
   phone.addButton("§fขนาดตัว", "textures/icons_apps/effect.png");
   phone.addButton(
     "§fตลาด",
     "textures/icons_apps/app_store/store_purchase",
   );
   phone.show(player).then((response) => {
     if (response.canceled) {
       return;
     }
   });
 */
