import { Player, system } from "@minecraft/server"
import { FormCancelationReason, ModalFormData } from "@minecraft/server-ui"
import allPlugins from "../../../Configs/PluginConfigs"
import loadPlugins from "./LoadConfig"
import setConfig from "./SetConfig"

export default function showForm(pl: Player) {
  const ui = new ModalFormData()
  ui.title(`§cPlugin §eManagers §8[Configs]`)
  allPlugins().filter(x => !x.setting.isLoader).forEach(toggle => {
    ui.toggle(toggle.name, toggle.setting.enabled)
  })
  ui.show(pl as any).then(async res => {
    if (res.canceled) return;
    if (res.cancelationReason == FormCancelationReason.UserBusy) {
      await new Promise((res) => system.runTimeout(res as any, 20))
      showForm(pl)
      return
    }
    allPlugins().filter(x => !x.setting.isLoader).forEach((pl, i) => {
      console.warn(res.formValues[i])
      setConfig(pl.name, res.formValues[i] as boolean)
    })
    loadPlugins(false)
  })
}