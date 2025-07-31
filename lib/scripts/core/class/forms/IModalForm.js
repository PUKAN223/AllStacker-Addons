import { ModalFormData } from "@minecraft/server-ui";
class IModalForm {
    constructor(title = "", submitButtonText = "Submit") {
        this.elements = [];
        this.title = title;
        this.submitButtonText = submitButtonText;
    }
    /**
     * Set the form title
     */
    setTitle(title) {
        this.title = title;
        return this;
    }
    /**
     * Get the current title
     */
    getTitle() {
        return this.title;
    }
    /**
     * Set the submit button text
     */
    setSubmitButton(text) {
        this.submitButtonText = text;
        return this;
    }
    /**
     * Get the submit button text
     */
    getSubmitButtonText() {
        return this.submitButtonText;
    }
    /**
     * Add a text field
     */
    addTextField(label, placeholderText, defaultValue) {
        this.elements.push({ label, placeholderText, defaultValue });
        return this;
    }
    /**
     * Add a text field object
     */
    addTextFieldObject(textField) {
        this.elements.push(textField);
        return this;
    }
    /**
     * Get all text fields from the form
     */
    getTextFields() {
        return this.elements.filter(this.isTextField);
    }
    /**
     * Add a toggle switch
     */
    addToggle(label, defaultValue) {
        this.elements.push({ label, defaultValue });
        return this;
    }
    /**
     * Add a toggle object
     */
    addToggleObject(toggle) {
        this.elements.push(toggle);
        return this;
    }
    /**
     * Get all toggles from the form
     */
    getToggles() {
        return this.elements.filter(this.isToggle);
    }
    /**
     * Add a slider
     */
    addSlider(label, minimumValue, maximumValue, valueStep, defaultValue) {
        this.elements.push({ label, minimumValue, maximumValue, valueStep, defaultValue });
        return this;
    }
    /**
     * Add a slider object
     */
    addSliderObject(slider) {
        this.elements.push(slider);
        return this;
    }
    /**
     * Get all sliders from the form
     */
    getSliders() {
        return this.elements.filter(this.isSlider);
    }
    /**
     * Add a dropdown
     */
    addDropdown(label, options, defaultValueIndex) {
        this.elements.push({ label, options, defaultValueIndex });
        return this;
    }
    /**
     * Add a dropdown object
     */
    addDropdownObject(dropdown) {
        this.elements.push(dropdown);
        return this;
    }
    /**
     * Get all dropdowns from the form
     */
    getDropdowns() {
        return this.elements.filter(this.isDropdown);
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
     * Check if the form has any input elements (textField, toggle, slider, dropdown)
     */
    hasInputElements() {
        return this.elements.some(element => this.isTextField(element) ||
            this.isToggle(element) ||
            this.isSlider(element) ||
            this.isDropdown(element));
    }
    /**
     * Get all elements
     */
    getElements() {
        return this.elements;
    }
    addCallback(callback) {
        this.callback = callback;
        return this;
    }
    /**
     * Show the form to a player and return the response
     */
    show(player) {
        return __awaiter(this, void 0, void 0, function* () {
            const form = new ModalFormData();
            form.title(this.title);
            form.submitButton(this.submitButtonText);
            this.elements.forEach(element => {
                if (this.isDivider(element)) {
                    form.divider();
                }
                else if (this.isHeader(element)) {
                    // Note: ModalFormData doesn't have a header method, incorporating into divider or label
                    form.label(element.text_header);
                }
                else if (this.isLabel(element)) {
                    form.label(element.text_label);
                }
                else if (this.isTextField(element)) {
                    form.textField(element.label, element.placeholderText || "", { defaultValue: element.defaultValue || "" });
                }
                else if (this.isToggle(element)) {
                    form.toggle(element.label, { defaultValue: element.defaultValue || false });
                }
                else if (this.isSlider(element)) {
                    form.slider(element.label, element.minimumValue, element.maximumValue, { defaultValue: element.defaultValue || 0, valueStep: element.valueStep });
                }
                else if (this.isDropdown(element)) {
                    form.dropdown(element.label, element.options, { defaultValueIndex: element.defaultValueIndex || 0 });
                }
            });
            try {
                const response = yield form.show(player);
                return response;
            }
            catch (error) {
                console.error("Error showing modal form:", error);
                throw error;
            }
        });
    }
    /**
     * Show the form and process the results with a callback
     */
    showWithCallback(player) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const response = yield this.show(player);
                if (response.canceled) {
                    (_a = this.callback) === null || _a === void 0 ? void 0 : _a.call(this, [], true);
                }
                else {
                    (_b = this.callback) === null || _b === void 0 ? void 0 : _b.call(this, response.formValues || [], false);
                }
            }
            catch (error) {
                console.error("Error in showWithCallback:", error);
                this.callback([], true);
            }
        });
    }
    // Type guard methods for better type safety
    isTextField(element) {
        return 'label' in element && 'placeholderText' in element;
    }
    isToggle(element) {
        return 'label' in element && 'defaultValue' in element && typeof element.defaultValue === 'boolean';
    }
    isSlider(element) {
        return 'minimumValue' in element && 'maximumValue' in element && 'valueStep' in element;
    }
    isDropdown(element) {
        return 'options' in element && Array.isArray(element.options);
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
export default IModalForm;
//# sourceMappingURL=IModalForm.js.map