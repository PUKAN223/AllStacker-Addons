import { ActionFormData } from "@minecraft/server-ui";
class IActionForm {
    constructor(title = "", body = "") {
        this.elements = [];
        this.title = title;
        this.body = body;
    }
    /**
     * Set the form title
     */
    setTitle(title) {
        this.title = title;
        return this;
    }
    /**
     * Set the form body text
     */
    setBody(body) {
        this.body = body;
        return this;
    }
    /**
     * Get the current title
     */
    getTitle() {
        return this.title;
    }
    /**
     * Get the current body text
     */
    getBody() {
        return this.body;
    }
    /**
     * Add multiple buttons at once
     */
    addButtons(buttons) {
        this.elements.push(...buttons);
        return this;
    }
    /**
     * Add a single button
     */
    addButton(label, icon, onClick) {
        this.elements.push({ label, icon, onClick });
        return this;
    }
    /**
     * Add a button object
     */
    addButtonObject(button) {
        this.elements.push(button);
        return this;
    }
    /**
     * Get all buttons from the form
     */
    getButtons() {
        return this.elements.filter(this.isButton);
    }
    /**
     * Add a divider to separate elements
     */
    addDivider() {
        this.elements.push({ divider: true });
        return this;
    }
    /**
     * Get all dividers from the form
     */
    getDividers() {
        return this.elements.filter(this.isDivider);
    }
    /**
     * Add a header text
     */
    addHeader(text) {
        this.elements.push({ text_header: text });
        return this;
    }
    /**
     * Add a header object
     */
    addHeaderObject(header) {
        this.elements.push(header);
        return this;
    }
    /**
     * Get the first header from the form
     */
    getHeader() {
        return this.elements.find(this.isHeader);
    }
    /**
     * Get all headers from the form
     */
    getHeaders() {
        return this.elements.filter(this.isHeader);
    }
    /**
     * Add a label text
     */
    addLabel(text) {
        this.elements.push({ text_label: text });
        return this;
    }
    /**
     * Add a label object
     */
    addLabelObject(label) {
        this.elements.push(label);
        return this;
    }
    /**
     * Get all labels from the form
     */
    getLabels() {
        return this.elements.filter(this.isLabel);
    }
    /**
     * Clear all elements from the form
     */
    clearElements() {
        this.elements = [];
        return this;
    }
    /**
     * Get the total number of elements
     */
    getElementCount() {
        return this.elements.length;
    }
    /**
     * Check if the form has any buttons
     */
    hasButtons() {
        return this.getButtons().length > 0;
    }
    /**
     * Show the form to a player
     */
    show(player) {
        return __awaiter(this, void 0, void 0, function* () {
            const form = new ActionFormData();
            form.title(this.title);
            form.body(this.body);
            // Track button indices for callback handling
            let buttonIndex = 0;
            const buttonCallbacks = [];
            this.elements.forEach(element => {
                if (this.isDivider(element)) {
                    form.divider();
                }
                else if (this.isHeader(element)) {
                    form.header(element.text_header);
                }
                else if (this.isLabel(element)) {
                    form.label(element.text_label);
                }
                else if (this.isButton(element)) {
                    form.button(element.label, element.icon);
                    buttonCallbacks[buttonIndex] = element.onClick || (() => { });
                    buttonIndex++;
                }
            });
            form.body(this.body);
            try {
                const response = yield form.show(player);
                if (!response.canceled && response.selection !== undefined) {
                    const callback = buttonCallbacks[response.selection];
                    if (callback) {
                        callback();
                    }
                }
                return response;
            }
            catch (error) {
                console.error("Error showing form:", error);
                throw error;
            }
        });
    }
    isButton(element) {
        return 'label' in element;
    }
    isDivider(element) {
        return 'divider' in element && element.divider === true;
    }
    isHeader(element) {
        return 'text_header' in element;
    }
    isLabel(element) {
        return 'text_label' in element;
    }
}
export default IActionForm;
//# sourceMappingURL=IActionForm.js.map