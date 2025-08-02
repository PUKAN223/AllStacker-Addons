import IActionForm from "./forms/IActionForm";
import IMessageForm from "./forms/IMessageForm";
import IModalForm from "./forms/IModalForm";
export const PageBuilderData = {};
class PageBuilder {
    constructor(id) {
        this.pages = {};
        this.id = id;
        PageBuilderData[this.id] = this;
    }
    static getPageBuilder(pageId) {
        return PageBuilderData[pageId];
    }
    addPage(pageId, uiBuilder) {
        this.pages[pageId] = uiBuilder;
        PageBuilderData[this.id] = this;
        return this;
    }
    getPage(pageId) {
        return this.pages[pageId];
    }
    getId() {
        return this.id;
    }
    getPages() {
        return this.pages;
    }
    removePage(pageId) {
        if (this.pages[pageId]) {
            delete this.pages[pageId];
            delete PageBuilderData[this.id];
            return true;
        }
        return false;
    }
    showPage(player, pageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = this.getPages()[pageId];
            if (!page) {
                return Promise.reject(new Error(`Page with ID ${pageId} does not exist`));
            }
            if (page instanceof IActionForm) {
                return page.show(player).then(() => { });
            }
            else if (page instanceof IMessageForm) {
                return page.show(player).then(() => { });
            }
            else if (page instanceof IModalForm) {
                return page.showWithCallback(player).then(() => { });
            }
            else {
                return Promise.reject(new Error("Unknown form type"));
            }
        });
    }
}
export { PageBuilder };
//# sourceMappingURL=PageBuilders.js.map