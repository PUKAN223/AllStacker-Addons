import { Player } from "@minecraft/server";
import { IActionForm, LanguageManager } from "@axeth/api";

export function showLanguageMenu(pl: Player, onBack: () => void): void {
  const lang = LanguageManager.getInstance();
  const t = lang.for(pl);

  const form = IActionForm.createForm(
    t("allstacker.title.language"),
    t("allstacker.body.language"),
  );

  form.addDivider();
  form.addButton("§cEnglish §8[ENG]§r", "textures/kisux3/ENG_Lang", () => {
    lang.setPlayerLanguage(pl, "en");
    pl.sendMessage(t("allstacker.message.language.set.english"));
    onBack();
  });

  form.addButton("§2ไทย §8[TH]§r", "textures/kisux3/TH_Lang", () => {
    lang.setPlayerLanguage(pl, "th");
    pl.sendMessage(t("allstacker.message.language.set.thai"));
    onBack();
  });

  form.addDivider();
  form.addButton(t("allstacker.button.back"), "", onBack);

  form.show(pl).catch(() => {});
}
