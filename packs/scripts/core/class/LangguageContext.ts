import { Player } from "@minecraft/server";

class LanguageContext {
  private static instance: LanguageContext;
  private languageData: {
    [lang: string]: Record<string, (pl: Player) => string>;
  } = {};

  constructor() {
    this.languageData["en"] = {};
    this.languageData["th"] = {};
  }

  public setLanguage(
    lang: string,
    data: Record<string, (pl: Player) => string>,
  ): void {
    this.languageData[lang] = data;
  }

  public getTranslation(key: string, pl: Player): string {
    const lang = pl.getDynamicProperty("language") as string || "en";
    if (this.languageData[lang] && this.languageData[lang][key]) {
      return this.languageData[lang][key](pl);
    }
    return this.languageData["en"][key]?.(pl) || key;
  }

  public setPlayerLanguage(pl: Player, lang: string): void {
    pl.setDynamicProperty("language", lang);
  }
}

export default LanguageContext;
