import { Player } from "@minecraft/server";
import IActionForm from "./forms/IActionForm";
import IMessageForm from "./forms/IMessageForm";
import IModalForm from "./forms/IModalForm";

export const PageBuilderData: { [key: string]: PageBuilder } = {};

class PageBuilder {
    private id: string;
    private pages: { [key: string]: IActionForm | IMessageForm | IModalForm } = {};
    constructor(id: string) {
        this.id = id;
        PageBuilderData[this.id] = this
    }

    static getPageBuilder(pageId: string): PageBuilder | undefined {
        return PageBuilderData[pageId]
    }

    public addPage(pageId: string, uiBuilder: IActionForm | IMessageForm | IModalForm) {
        this.pages[pageId] = uiBuilder;
        PageBuilderData[this.id] = this;
        return this;
    }

    public getPage(pageId: string): IActionForm | IMessageForm | IModalForm | undefined {
        return this.pages[pageId];
    }

    public getId(): string {
        return this.id;
    }

    public getPages(): { [key: string]: IActionForm | IMessageForm | IModalForm } {
        return this.pages;
    }

    public removePage(pageId: string): boolean {
        if (this.pages[pageId]) {
            delete this.pages[pageId];
            delete PageBuilderData[this.id];
            return true;
        }
        return false;
    }

    public async showPage(player: Player, pageId: string): Promise<void> {
        const page = this.getPages()[pageId];
        if (!page) {
            return Promise.reject(new Error(`Page with ID ${pageId} does not exist`));
        }

        if (page instanceof IActionForm) {
            return page.show(player).then(() => {});
        } else if (page instanceof IMessageForm) {
            return page.show(player).then(() => {});
        } else if (page instanceof IModalForm) {
            return page.showWithCallback(player).then(() => {});
        } else {
            return Promise.reject(new Error("Unknown form type"));
        }
    }
}

export { PageBuilder };