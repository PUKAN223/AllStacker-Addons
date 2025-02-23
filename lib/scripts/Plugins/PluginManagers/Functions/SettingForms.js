import { system } from "@minecraft/server";
import { FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import allPlugins from "../../../Configs/PluginConfigs";
import loadPlugins from "./LoadConfig";
import setConfig from "./SetConfig";
export default function showForm(pl) {
    const ui = new ModalFormData();
    ui.title(`§cPlugin §eManagers §8[Configs]`);
    allPlugins().filter(x => !x.setting.isLoader).forEach(toggle => {
        ui.toggle(toggle.name, toggle.setting.enabled);
    });
    ui.show(pl).then((res) => __awaiter(this, void 0, void 0, function* () {
        if (res.cancelationReason == FormCancelationReason.UserBusy) {
            yield new Promise((res) => system.runTimeout(res, 20));
            showForm(pl);
            return;
        }
        allPlugins().filter(x => !x.setting.isLoader).forEach((pl, i) => {
            console.warn(res.formValues[i]);
            setConfig(pl.name, res.formValues[i]);
        });
        loadPlugins(false);
    }));
}
//# sourceMappingURL=SettingForms.js.map