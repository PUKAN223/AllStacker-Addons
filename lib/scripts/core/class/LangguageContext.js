class LanguageContext {
    constructor() {
        this.languageData = {};
        this.languageData["en"] = {};
        this.languageData["th"] = {};
    }
    setLanguage(lang, data) {
        this.languageData[lang] = data;
    }
    getTranslation(key, pl) {
        var _a, _b;
        const lang = pl.getDynamicProperty("language") || "en";
        if (this.languageData[lang] && this.languageData[lang][key]) {
            return this.languageData[lang][key](pl);
        }
        return ((_b = (_a = this.languageData["en"])[key]) === null || _b === void 0 ? void 0 : _b.call(_a, pl)) || key;
    }
    setPlayerLanguage(pl, lang) {
        pl.setDynamicProperty("language", lang);
    }
}
export default LanguageContext;
//# sourceMappingURL=LangguageContext.js.map