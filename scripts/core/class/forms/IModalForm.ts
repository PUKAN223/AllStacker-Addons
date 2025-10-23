import { ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import { Player } from "@minecraft/server";
import { IModalFormTextField } from "../../types/IModalForm/Elements/TextField";
import { IModalFormToggle } from "../../types/IModalForm/Elements/Toggle";
import { IModalFormSlider } from "../../types/IModalForm/Elements/Slider";
import { IModalFormDropdown } from "../../types/IModalForm/Elements/Dropdown";
import { IModalFormDivider } from "../../types/IModalForm/Elements/Divider";
import { IModalFormHeader } from "../../types/IModalForm/Elements/Header";
import { IModalFormLabel } from "../../types/IModalForm/Elements/Label";

type FormElement =
  | IModalFormTextField
  | IModalFormToggle
  | IModalFormSlider
  | IModalFormDropdown
  | IModalFormDivider
  | IModalFormHeader
  | IModalFormLabel;

class IModalForm {
  private title: string;
  private elements: FormElement[] = [];
  private submitButtonText: string;
  private callback?: (formValues: any[], canceled: boolean) => void;

  constructor(title: string = "", submitButtonText: string = "Submit") {
    this.title = title;
    this.submitButtonText = submitButtonText;
  }

  /**
   * Set the form title
   */
  public setTitle(title: string): this {
    this.title = title;
    return this;
  }

  /**
   * Get the current title
   */
  public getTitle(): string {
    return this.title;
  }

  /**
   * Set the submit button text
   */
  public setSubmitButton(text: string): this {
    this.submitButtonText = text;
    return this;
  }

  /**
   * Get the submit button text
   */
  public getSubmitButtonText(): string {
    return this.submitButtonText;
  }

  /**
   * Add a text field
   */
  public addTextField(label: string, placeholderText?: string, defaultValue?: string): this {
    this.elements.push({ label, placeholderText, defaultValue });
    return this;
  }

  /**
   * Add a text field object
   */
  public addTextFieldObject(textField: IModalFormTextField): this {
    this.elements.push(textField);
    return this;
  }

  /**
   * Get all text fields from the form
   */
  public getTextFields(): IModalFormTextField[] {
    return this.elements.filter(this.isTextField);
  }

  /**
   * Add a toggle switch
   */
  public addToggle(label: string, defaultValue?: boolean): this {
    this.elements.push({ label, defaultValue });
    return this;
  }

  /**
   * Add a toggle object
   */
  public addToggleObject(toggle: IModalFormToggle): this {
    this.elements.push(toggle);
    return this;
  }

  /**
   * Get all toggles from the form
   */
  public getToggles(): IModalFormToggle[] {
    return this.elements.filter(this.isToggle);
  }

  /**
   * Add a slider
   */
  public addSlider(
    label: string,
    minimumValue: number,
    maximumValue: number,
    valueStep: number,
    defaultValue?: number
  ): this {
    this.elements.push({ label, minimumValue, maximumValue, valueStep, defaultValue });
    return this;
  }

  /**
   * Add a slider object
   */
  public addSliderObject(slider: IModalFormSlider): this {
    this.elements.push(slider);
    return this;
  }

  /**
   * Get all sliders from the form
   */
  public getSliders(): IModalFormSlider[] {
    return this.elements.filter(this.isSlider);
  }

  /**
   * Add a dropdown
   */
  public addDropdown(label: string, options: string[], defaultValueIndex?: number): this {
    this.elements.push({ label, options, defaultValueIndex });
    return this;
  }

  /**
   * Add a dropdown object
   */
  public addDropdownObject(dropdown: IModalFormDropdown): this {
    this.elements.push(dropdown);
    return this;
  }

  /**
   * Get all dropdowns from the form
   */
  public getDropdowns(): IModalFormDropdown[] {
    return this.elements.filter(this.isDropdown);
  }

  /**
   * Add a divider to separate elements
   */
  public addDivider(): this {
    this.elements.push({ divider: true });
    return this;
  }

  /**
   * Get all dividers from the form
   */
  public getDividers(): IModalFormDivider[] {
    return this.elements.filter(this.isDivider);
  }

  /**
   * Add a header text
   */
  public addHeader(text: string): this {
    this.elements.push({ text_header: text });
    return this;
  }

  /**
   * Add a header object
   */
  public addHeaderObject(header: IModalFormHeader): this {
    this.elements.push(header);
    return this;
  }

  /**
   * Get the first header from the form
   */
  public getHeader(): IModalFormHeader | undefined {
    return this.elements.find(this.isHeader);
  }

  /**
   * Get all headers from the form
   */
  public getHeaders(): IModalFormHeader[] {
    return this.elements.filter(this.isHeader);
  }

  /**
   * Add a label text
   */
  public addLabel(text: string): this {
    this.elements.push({ text_label: text });
    return this;
  }

  /**
   * Add a label object
   */
  public addLabelObject(label: IModalFormLabel): this {
    this.elements.push(label);
    return this;
  }

  /**
   * Get all labels from the form
   */
  public getLabels(): IModalFormLabel[] {
    return this.elements.filter(this.isLabel);
  }

  /**
   * Clear all elements from the form
   */
  public clearElements(): this {
    this.elements = [];
    return this;
  }

  /**
   * Get the total number of elements
   */
  public getElementCount(): number {
    return this.elements.length;
  }

  /**
   * Check if the form has any input elements (textField, toggle, slider, dropdown)
   */
  public hasInputElements(): boolean {
    return this.elements.some(
      (element) =>
        this.isTextField(element) || this.isToggle(element) || this.isSlider(element) || this.isDropdown(element)
    );
  }

  /**
   * Get all elements
   */
  public getElements(): FormElement[] {
    return this.elements;
  }

  public addCallback(callback: (formValues: any[], canceled: boolean) => void): this {
    this.callback = callback;
    return this;
  }

  /**
   * Show the form to a player and return the response
   */
  public async show(player: Player): Promise<ModalFormResponse> {
    const form = new ModalFormData();
    form.title(this.title);
    form.submitButton(this.submitButtonText);

    this.elements.forEach((element) => {
      if (this.isDivider(element)) {
        form.divider();
      } else if (this.isHeader(element)) {
        // Note: ModalFormData doesn't have a header method, incorporating into divider or label
        form.label(element.text_header);
      } else if (this.isLabel(element)) {
        form.label(element.text_label);
      } else if (this.isTextField(element)) {
        form.textField(element.label, element.placeholderText || "", { defaultValue: element.defaultValue || "" });
      } else if (this.isToggle(element)) {
        form.toggle(element.label, { defaultValue: element.defaultValue || false });
      } else if (this.isSlider(element)) {
        form.slider(element.label, element.minimumValue, element.maximumValue, {
          defaultValue: element.defaultValue || 0,
          valueStep: element.valueStep,
        });
      } else if (this.isDropdown(element)) {
        form.dropdown(element.label, element.options, { defaultValueIndex: element.defaultValueIndex || 0 });
      }
    });

    try {
      const response = await form.show(player as any);
      return response;
    } catch (error) {
      console.error("Error showing modal form:", error);
      throw error;
    }
  }

  /**
   * Show the form and process the results with a callback
   */
  public async showWithCallback(player: Player): Promise<void> {
    try {
      const response = await this.show(player);

      if (response.canceled) {
        this.callback?.([], true);
      } else {
        this.callback?.(response.formValues || [], false);
      }
    } catch (error) {
      console.error("Error in showWithCallback:", error);
      this.callback([], true);
    }
  }

  // Type guard methods for better type safety
  private isTextField(element: FormElement): element is IModalFormTextField {
    return "label" in element && "placeholderText" in element;
  }

  private isToggle(element: FormElement): element is IModalFormToggle {
    return "label" in element && "defaultValue" in element && typeof (element as any).defaultValue === "boolean";
  }

  private isSlider(element: FormElement): element is IModalFormSlider {
    return "minimumValue" in element && "maximumValue" in element && "valueStep" in element;
  }

  private isDropdown(element: FormElement): element is IModalFormDropdown {
    return "options" in element && Array.isArray((element as any).options);
  }

  private isDivider(element: FormElement): element is IModalFormDivider {
    return "divider" in element && element.divider === true;
  }

  private isHeader(element: FormElement): element is IModalFormHeader {
    return "text_header" in element;
  }

  private isLabel(element: FormElement): element is IModalFormLabel {
    return "text_label" in element;
  }
}

export default IModalForm;
