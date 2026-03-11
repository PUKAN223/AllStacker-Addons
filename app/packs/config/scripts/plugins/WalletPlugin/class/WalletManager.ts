import { IActionForm, IModalForm, PlayerUtils, PluginBase } from "@axeth/api";
import { Player, world } from "@minecraft/server";
import { WalletProfileDataManager } from "./WalletProfileDataManager.ts";

export interface WalletProfile {
  discord: string;
  age: number;
  description: string;
}

class WalletManager {
  private plugin: PluginBase;
  private moneyScore = "money";
  private walletProfiles!: WalletProfileDataManager;

  private constructor(plugin: PluginBase) {
    this.plugin = plugin;
    this.walletProfiles = new WalletProfileDataManager(this.plugin);

    this.registerItemEvent();
    this.registerCustomEvents();
    this.registerEvents();
  }

  static initialize(plugin: PluginBase): WalletManager {
    return new WalletManager(plugin);
  }

  private registerEvents() {
    this.plugin.events.on<
      "CustomPlayerMoneyChange",
      { player: Player; oldMoney: number; newMoney: number }
    >("CustomPlayerMoneyChange", ({ player, newMoney }) => {
      const inv = player.hasComponent("inventory")
        ? player.getComponent("inventory")
        : null;
      if (!inv) return;
      const containers = inv.container;
      for (let i = 0; i < containers.size; i++) {
        const item = containers.getItem(i);
        if (!item) continue;
        if (item.typeId === "kisu:wallet") {
          item.nameTag = `§r§fกระเป๋าสตางค์` +
            `\n§7ยอดเงินในกระเป๋า§r: §c${newMoney} §7ทุง`;
          containers.setItem(i, item);
        }
      }
    });
  }

  private registerItemEvent() {
    this.plugin.itemActionManager.registerItem("kisu:wallet").onUse((pl) => {
      this.openWalletMenu(pl);
    });
  }

  private registerCustomEvents() {
    const lastPlayerMoneyScore = new Map<Player, number>();

    this.plugin.events.on("AfterTick", ({ currentTick }) => {
      if (currentTick % 20 !== 0) return;
      for (const player of world.getAllPlayers()) {
        const currentMoney = this.getScore(player, this.moneyScore);
        const lastMoney = lastPlayerMoneyScore.get(player) || 0;
        if (currentMoney !== lastMoney) {
          lastPlayerMoneyScore.set(player, currentMoney);
          this.plugin.events.emit("CustomPlayerMoneyChange", {
            player,
            oldMoney: lastMoney,
            newMoney: currentMoney,
          });
        }
      }
    });
  }

  private getScore(player: Player, scoreName: string): number {
    const scoreboard = this.plugin.world.scoreboard;
    const obj = scoreboard.getObjective(scoreName);
    if (!obj) return 0;
    if (!obj.hasParticipant(player)) return 0;
    const score = obj.getScore(player);
    return score ? score : 0;
  }

  private setScore(player: Player, scoreName: string, value: number): boolean {
    const scoreboard = this.plugin.world.scoreboard;
    const obj = scoreboard.getObjective(scoreName);
    if (!obj) return false;
    obj.setScore(player, Math.max(0, Math.floor(value)));
    return true;
  }

  private addScore(player: Player, scoreName: string, amount: number): boolean {
    const current = this.getScore(player, scoreName);
    return this.setScore(player, scoreName, current + amount);
  }

  private getWalletProfile(pl: Player): WalletProfile {
    const existing = this.walletProfiles.get(pl.id);
    if (existing) return existing;

    const created: WalletProfile = {
      discord: `Not set`,
      age: 0,
      description: "Not set",
    };
    this.walletProfiles.set(pl.id, created);
    return created;
  }

  private openWalletMenu(pl: Player) {
    const profile = this.getWalletProfile(pl);
    const padding = " ".repeat(21);
    const info = padding +
      `§r §0${profile.discord}\n\n${padding}§r §0${pl.name}\n\n${padding}§r §0Age: ${profile.age}\n\n\n${
        " ".repeat(7)
      }${profile.description}`;
    const walletMenu = IActionForm.createForm(
      `§w§a§l§l§e§t§r\n${info}`,
      `\nยินดีต้อนรับเข้าสู่กระเป๋าสตางค์ของคุณ\nยอดเงิน: §a${
        this.getScore(pl, this.moneyScore)
      } §7บาท`,
    );

    walletMenu.addButton(
      "§fเเก้ไขบัตร",
      "textures/ui/book_edit_default",
      () => {
        this.openEditWalletInfoMenu(pl);
      },
    );

    walletMenu.addButton(
      "§fให้เงิน",
      "textures/items/emerald",
      () => {
        this.openNearbyPlayerSelector(pl);
      },
    );

    walletMenu.addButton(
      "§fปิด",
      "textures/ui/arrowLeft",
    );

    walletMenu.show(pl);
  }

  private openEditWalletInfoMenu(pl: Player): void {
    const profile = this.getWalletProfile(pl);
    const editMenu = IModalForm.createForm(
      "แก้ไขข้อมูลกระเป๋า",
      "§fเปลี่ยน",
    );

    const formData = {
      discord: "",
      age: 0,
      description: "",
    };

    editMenu.addTextField({
      label: "ชื่อดิสคอร์ด",
      placeholderText: `กรุณากรอกชื่อดิสคอร์ด`,
      defaultValue: profile.discord !== "Not set" ? profile.discord : "",
    }, (value) => formData.discord = String(value ?? "").trim());

    editMenu.addTextField({
      label: "อายุ",
      placeholderText: `กรุณากรอกอายุ`,
      defaultValue: profile.age !== 0 ? profile.age.toString() : "",
    }, (value) => formData.age = Number(value ?? 0));

    editMenu.addTextField({
      label: "คำอธิบาย",
      placeholderText: `กรุณากรอกคำอธิบาย`,
      defaultValue: profile.description !== "Not set"
        ? profile.description
        : "",
    }, (value) => formData.description = String(value ?? "").trim());

    editMenu.show(pl).then((res) => {
      if (!res || res.canceled || !res.formValues) return;

      if (formData.description.length > 20) {
        PlayerUtils.sendToast(
          pl,
          "",
          this.plugin.mcColors("คำอธิบายยาวเกิน 20 ตัวอักษร").red,
        );
        return;
      }

      this.walletProfiles.set(pl.id, formData);
      PlayerUtils.sendToast(
        pl,
        "",
        this.plugin.mcColors("บันทึกข้อมูลกระเป๋าแล้ว").green,
      );
      this.openWalletMenu(pl);
    });
  }

  private openNearbyPlayerSelector(sender: Player): void {
    const nearbyPlayers = sender.dimension.getPlayers({
      location: sender.location,
      maxDistance: 5,
    }).filter((target) => target.id !== sender.id);

    if (nearbyPlayers.length <= 0) {
      PlayerUtils.sendToast(
        sender,
        "",
        this.plugin.mcColors("ไม่พบผู้เล่นในระยะ 5 บล็อก").red,
      );
      return;
    }

    const selector = IActionForm.createForm(
      "ให้เงินผู้เล่น",
      "เลือกผู้เล่นในระยะ 5 บล็อก",
    );

    selector.addButton(
      this.plugin.mcColors("ย้อนกลับ").yellow,
      "textures/ui/arrow_left",
      () => {
        this.openWalletMenu(sender);
      },
    );

    selector.addDivider();

    const iconList = [
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
    for (const target of nearbyPlayers) {
      selector.addButton(
        this.plugin.mcColors(target.nameTag || target.name).white,
        "textures/ui/default_cast/" +
          iconList[Math.floor(Math.random() * iconList.length)],
        () => {
          this.openTransferAmountMenu(sender, target);
        },
      );
    }

    selector.show(sender);
  }

  private openTransferAmountMenu(sender: Player, target: Player): void {
    const modal = IModalForm.createForm(
      "จำนวนเงิน",
      `§fโอนให้ ${target.nameTag || target.name}`,
    );
    modal.addTextField({
      label: "จำนวนเงินที่ต้องการโอน",
      placeholderText: "1000",
      defaultValue: "1000",
    }, () => {});

    modal.show(sender).then(async (res) => {
      if (!res || res.canceled || !res.formValues) return;

      const amount = Number.parseInt(String(res.formValues[0] ?? "0"));
      if (!Number.isFinite(amount) || amount <= 0) {
        PlayerUtils.sendToast(
          sender,
          "",
          this.plugin.mcColors("จำนวนเงินไม่ถูกต้อง").red,
        );
        return;
      }

      await this.confirmAndTransferMoney(sender, target, amount);
    });
  }

  private async confirmAndTransferMoney(
    sender: Player,
    target: Player,
    amount: number,
  ): Promise<void> {
    const senderMoney = this.getScore(sender, this.moneyScore);

    const confirm = IActionForm.createForm(
      "§a§c§t§i§o§n§r§fยืนยันการโอนเงิน",
    )
      .addLabel(
        `ผู้รับ: ${
          target.nameTag || target.name
        }\nจำนวน: ${amount.toLocaleString()}   เงินคงเหลือ: ${senderMoney.toLocaleString()}`,
      )
      .addButton("  ยกเลิก")
      .addButton("  ยืนยันโอน");

    const response = await confirm.show(sender);
    if (response.canceled || response.selection !== 1) return;

    if (senderMoney < amount) {
      PlayerUtils.sendToast(
        sender,
        "",
        this.plugin.mcColors("เงินของคุณไม่พอ").red,
      );
      return;
    }

    const senderSet = this.setScore(
      sender,
      this.moneyScore,
      senderMoney - amount,
    );
    if (!senderSet) {
      PlayerUtils.sendToast(
        sender,
        "",
        this.plugin.mcColors(`ไม่พบสกอร์ ${this.moneyScore}`).red,
      );
      return;
    }

    const receiverAdd = this.addScore(target, this.moneyScore, amount);
    if (!receiverAdd) {
      // Refund if cannot add to receiver
      this.setScore(sender, this.moneyScore, senderMoney);
      PlayerUtils.sendToast(
        sender,
        "",
        this.plugin.mcColors(`ไม่พบสกอร์ ${this.moneyScore}`).red,
      );
      return;
    }

    PlayerUtils.sendToast(
      sender,
      "",
      this.plugin.mcColors(
        `โอนเงิน ${amount.toLocaleString()} ให้ ${
          target.nameTag || target.name
        } สำเร็จ`,
      ).green,
    );

    PlayerUtils.sendToast(
      target,
      "",
      this.plugin.mcColors(
        `ได้รับเงิน ${amount.toLocaleString()} จาก ${
          sender.nameTag || sender.name
        }`,
      ).green,
    );
  }
}

export { WalletManager };
