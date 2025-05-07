import CommandBuilder from "../../../Class/CommandBuilders";
import showForm from "../Functions/SettingForms";

new CommandBuilder(
  "plm-config",
  "Use this command to show config forms.",
  "!",
  (pl) => {
    return true
  }
).overload((pl) => {
  showForm(pl)
})