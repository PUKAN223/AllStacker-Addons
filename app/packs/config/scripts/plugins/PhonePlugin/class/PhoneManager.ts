import { IActionForm, PluginBase } from "@axeth/api";
import { Player } from "@minecraft/server";
import { BasePhoneApp } from "./BasePhoneApp.ts";

class PhoneManager {
  private plugin: PluginBase;
  private apps: (typeof BasePhoneApp)[];

  private constructor(plugin: PluginBase) {
    this.plugin = plugin;
    this.apps = [];

    this.registerPhoneUse();
  }

  static initialize(plugin: PluginBase): PhoneManager {
    return new PhoneManager(plugin);
  }

  private registerPhoneUse() {
    this.plugin.itemActionManager.registerItem("kisu:phone").onUse(
      (player, _item) => {
        this.handlePhoneUse(player);
      },
    );
  }

  private handlePhoneUse(player: Player): void {
    this.showHomeMenu(player);
  }

  private showHomeMenu(player: Player): void {
    const homeUi = IActionForm.createForm(
      "title.smartphone_home",
      `    มือถือ ${" ".repeat(17)}   §a100%%§r`,
    );
    this.apps.forEach((app) => {
      const appInstance = new app(this.plugin);
      homeUi.addButton(
        "§2" + appInstance.name,
        appInstance.icon,
        () => appInstance.showAppMenu(player, () => this.showHomeMenu(player)),
      );
    });
    homeUi.show(player);
  }

  public registerApp(app: typeof BasePhoneApp) {
    this.apps.push(app);
  }
}

export { PhoneManager };
