import { IActionForm, IModalForm, PluginBase } from "@axeth/api";
import { Player } from "@minecraft/server";

export enum AppFormType {
  ActionForm,
  ModalForm,
}

class BasePhoneApp {
  public name: string;
  public icon: string;
  public formType: AppFormType;

  public plugin: PluginBase;

  constructor(plugin: PluginBase) {
    this.name = "Default Phone App";
    this.icon = "textures/icons_apps/app_store";
    this.formType = AppFormType.ActionForm;
    this.plugin = plugin;
  }

  public getFormType(): AppFormType {
    return this.formType;
  }

  public getAppHome(_pl: Player, previosForm: (pl: Player) => void) {
    if (this.formType === AppFormType.ActionForm) {
      return IActionForm.createForm(
        `title.smartphone_settings`,
        `    ${this.name} ${" ".repeat(21 - this.name.length)}   §a100%%§r`,
        previosForm,
      );
    } else {
      return IModalForm.createForm(
        `title.smartphone_bank  100%%`,
      );
    }
  }

  public showAppMenu(player: Player, previosForm: (pl: Player) => void): void {
    const appUi = this.getAppHome(player, previosForm);
    if (appUi.getElementCount() === 0) {
      appUi instanceof IActionForm
        ? appUi.addButton(`Coming Soon!`)
        : appUi.addLabel(`Coming Soon!`);
    }
    appUi.show(player);
  }
}

export { BasePhoneApp };
