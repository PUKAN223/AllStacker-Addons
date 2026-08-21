import { Player } from "@minecraft/server";

export class LanguageManager {
  private static instance: LanguageManager;
  private languageData: {
    [lang: string]: Record<string, string | ((pl: Player) => string)>;
  } = {};

  private constructor() {
    this.languageData["en"] = {};
    this.languageData["th"] = {};
  }

  public static getInstance(): LanguageManager {
    if (!LanguageManager.instance) {
      LanguageManager.instance = new LanguageManager();
    }
    return LanguageManager.instance;
  }

  public setLanguage(
    lang: string,
    data: Record<string, string | ((pl: Player) => string)>,
  ): void {
    if (!this.languageData[lang]) {
      this.languageData[lang] = {};
    }
    this.languageData[lang] = { ...this.languageData[lang], ...data };
  }

  public getTranslation(key: string, pl?: Player): string {
    const lang = pl?.getDynamicProperty("language") as string || "en";
    
    // Check requested language
    if (this.languageData[lang] && this.languageData[lang][key]) {
      const val = this.languageData[lang][key];
      return typeof val === "function" ? (pl ? val(pl) : key) : val;
    }
    
    // Fallback to English
    if (this.languageData["en"] && this.languageData["en"][key]) {
      const val = this.languageData["en"][key];
      return typeof val === "function" ? (pl ? val(pl) : key) : val;
    }
    
    // Return key if not found
    return key;
  }

  /**
   * Returns a bound translator function `t(key)` pre-filled with the given player.
   *
   * Usage:
   * ```ts
   * const t = LanguageManager.getInstance().for(pl);
   * form.addButton(t("allstacker.button.back"), ...);
   * ```
   */
  public for(pl: Player): (key: string) => string {
    return (key: string) => this.getTranslation(key, pl);
  }

  public setPlayerLanguage(pl: Player, lang: string): void {
    pl.setDynamicProperty("language", lang);
  }
}
