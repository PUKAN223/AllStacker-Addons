import { Player } from "@minecraft/server";
import { AppFormType, BasePhoneApp } from "../class/BasePhoneApp.ts";
import { IActionForm, IModalForm } from "@axeth/api";
import { BillDataManager } from "../class/BillDataManager.ts";
import { PlayerUtils } from "../../../../../../../packages/api/src/global/Player.ts";

class GovernmentApp extends BasePhoneApp {
  public override name: string = "หน่วยงาน";
  public override icon: string = "textures/icons_apps/government.png";
  public override formType: AppFormType = AppFormType.ActionForm;

  private billDataManagers = new BillDataManager(this.plugin);
  private iconList = [
    "alex_icon",
    "ari_icon",
    "efe_icon",
    "kai_icon",
    "makena_icon",
    "noor_icon",
    "steve_icon",
    "sunny_icon",
    "zuri_icon",
  ];

  private governmentTags = [
    "police",
    "medic",
    "admin",
  ];

  public override getAppHome(
    pl: Player,
    previosForm: (pl: Player) => void,
  ): IActionForm | IModalForm {
    const gpsForm = super.getAppHome(pl, previosForm);
    if (gpsForm instanceof IModalForm) return gpsForm;
    if (!pl.getTags().some((x) => this.governmentTags.includes(x))) {
      const notGovernment = super.getAppHome(pl, previosForm);
      if (notGovernment instanceof IActionForm) {
        notGovernment.addButton(
          `§cคุณไม่ใช่หน่วยงาน`,
          `textures/icons_apps/government`,
          () => {
          },
        );
        notGovernment.addButton(
          `กลับ`,
          `textures/icons_apps/back`,
          () => {
            previosForm(pl);
          },
        );
      }
      return notGovernment;
    }
    // const bills = Object.values(this.billDataManagers.getBills()).flat().filter(
    //   (x) => x.sender === pl.name,
    // );
    //
    // i want with key
    const bills = Object.entries(this.billDataManagers.data)
      .flatMap(([key, value]) => value.map((x) => ({ ...x, key })))
      .filter((x) => x.sender === pl.name);

    //get keyid
    //

    gpsForm.addButton(
      `รายการบิล ${bills.length}`,
      "textures/icons_apps/app_store/bank_purchased",
    );

    if (bills.length === 0) {
      gpsForm.addButton(
        "ไม่มีรายการบิล",
        "textures/icons_apps/app_store/bank_purchased",
      );
    }

    gpsForm.addButton(
      "สร้างบิล",
      "textures/icons_apps/app_store/bank_purchased",
      () => {
        this.createBillForm(pl, () => {
          this.showAppMenu(pl, () => {});
        });
      },
    );

    for (const bill of bills) {
      gpsForm.addButton(
        `บิล #§e${bill.id}\n§7${bill.receiver} - §a${bill.amount}$§r`,
        "textures/icons_apps/app_store/bank_purchased",
        () => {
          this.billDataManagers.removeBill(bill.key, bill.id);
          PlayerUtils.sendToast(pl, ``, `ลบบิล #${bill.id} เรียบร้อยแล้ว`);
          this.showAppMenu(pl, () => {});
        },
      );
    }
    return gpsForm;
  }

  private createBillForm(pl: Player, previosForm: (pl: Player) => void) {
    const createBillForm = super.getAppHome(pl, previosForm) as IActionForm;
    const playerNears = pl.dimension.getEntities({
      type: "minecraft:player",
      maxDistance: 5,
      location: pl.location,
    }).filter((p) => p.id !== pl.id) as Player[];
    if (playerNears.length === 0) {
      PlayerUtils.sendToast(pl, ``, `ไม่มีผู้เล่นในระยะ 5 บล็อค`);
    }

    for (const player of playerNears) {
      createBillForm.addButton(
        player.name,
        "textures/ui/default_cast/" +
          `${this.iconList[Math.floor(Math.random() * this.iconList.length)]}`,
        () => {
          const formData = {
            description: "",
            amount: 0,
          };

          const addBillUi = IModalForm.createForm(
            "title.smartphone_bank  100%%",
            "เพิ่ม",
          );
          addBillUi.addTextField({
            label: `§0คำอธิบาย`,
            placeholderText: `เช่น ค่าชุบ`,
          }, (value) => {
            formData.description = value;
          });
          addBillUi.addTextField(
            { label: "§0จำนวนเงิน", placeholderText: "0" },
            (value) => {
              //check is number
              if (!Number.isNaN(Number(value))) {
                formData.amount = Number(value);
              } else {
                PlayerUtils.sendToast(pl, ``, `จำนวนเงินไม่ถูกต้อง`);
              }
            },
          );
          addBillUi.show(pl).then((res) => {
            if (!res) return;
            if (res.canceled) return;

            const { description, amount } = formData;
            this.billDataManagers.addBill(player.id, {
              amount,
              description,
              receiver: player.name,
              sender: pl.name,
              id: this.generateBillId(),
            });
            PlayerUtils.sendToast(pl, ``, `บิลถูกสร้างเรียบร้อย`);
            PlayerUtils.sendToast(
              player,
              ``,
              `คุณได้รับบิลจำนวน ${amount} บาท\nกรุณาชำระที่เเอพธนาคาร`,
              `textures/items/smartphone`,
            );
          });
        },
      );
    }
    createBillForm.addButton("กลับ", `textures/icons_apps/back`, () => {
      createBillForm.back(pl);
    });

    createBillForm.show(pl);
  }

  private generateBillId(): number {
    //5 lenght a - Z 0 -9
    return Math.floor(Math.random() * 100000);
  }
}

export { GovernmentApp };
