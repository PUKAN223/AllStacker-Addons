import { MessageFormData } from "@minecraft/server-ui";
class IMessageForm {
    constructor(title = "", body = "") {
        this.button1 = null;
        this.button2 = null;
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
     * Set button 1 (left button)
     */
    setButton1(text, onClick) {
        this.button1 = { text, onClick };
        return this;
    }
    /**
     * Set button 1 object
     */
    setButton1Object(button) {
        this.button1 = button;
        return this;
    }
    /**
     * Set button 2 (right button)
     */
    setButton2(text, onClick) {
        this.button2 = { text, onClick };
        return this;
    }
    /**
     * Set button 2 object
     */
    setButton2Object(button) {
        this.button2 = button;
        return this;
    }
    /**
     * Get button 1
     */
    getButton1() {
        return this.button1;
    }
    /**
     * Get button 2
     */
    getButton2() {
        return this.button2;
    }
    /**
     * Check if button 1 is set
     */
    hasButton1() {
        return this.button1 !== null;
    }
    /**
     * Check if button 2 is set
     */
    hasButton2() {
        return this.button2 !== null;
    }
    /**
     * Check if any buttons are set
     */
    hasButtons() {
        return this.button1 !== null || this.button2 !== null;
    }
    /**
     * Clear all buttons
     */
    clearButtons() {
        this.button1 = null;
        this.button2 = null;
        return this;
    }
    /**
     * Clear button 1
     */
    clearButton1() {
        this.button1 = null;
        return this;
    }
    /**
     * Clear button 2
     */
    clearButton2() {
        this.button2 = null;
        return this;
    }
    /**
     * Show the form to a player and return the response
     */
    show(player) {
        return __awaiter(this, void 0, void 0, function* () {
            const form = new MessageFormData();
            form.title(this.title);
            form.body(this.body);
            if (this.button1) {
                form.button1(this.button1.text);
            }
            if (this.button2) {
                form.button2(this.button2.text);
            }
            try {
                const response = yield form.show(player);
                // Handle button callbacks
                if (!response.canceled && response.selection !== undefined) {
                    if (response.selection === 0 && this.button1 && this.button1.onClick) {
                        this.button1.onClick();
                    }
                    else if (response.selection === 1 && this.button2 && this.button2.onClick) {
                        this.button2.onClick();
                    }
                }
                return response;
            }
            catch (error) {
                console.error("Error showing message form:", error);
                throw error;
            }
        });
    }
    /**
     * Show the form and process the results with a callback
     */
    showWithCallback(player, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.show(player);
                if (response.canceled) {
                    callback(undefined, true);
                }
                else {
                    callback(response.selection, false);
                }
            }
            catch (error) {
                console.error("Error in showWithCallback:", error);
                callback(undefined, true);
            }
        });
    }
    /**
     * Create a simple confirmation dialog
     */
    static createConfirmation(title, body, onConfirm, onCancel) {
        return new IMessageForm(title, body)
            .setButton1("Cancel", onCancel)
            .setButton2("Confirm", onConfirm);
    }
    /**
     * Create a simple yes/no dialog
     */
    static createYesNo(title, body, onYes, onNo) {
        return new IMessageForm(title, body)
            .setButton1("No", onNo)
            .setButton2("Yes", onYes);
    }
    /**
     * Create a simple OK dialog
     */
    static createOK(title, body, onOK) {
        return new IMessageForm(title, body)
            .setButton1("OK", onOK);
    }
    /**
     * Create a simple alert dialog
     */
    static createAlert(title, body, onClose) {
        return new IMessageForm(title, body)
            .setButton1("Close", onClose);
    }
}
export default IMessageForm;
//# sourceMappingURL=IMessageForm.js.map