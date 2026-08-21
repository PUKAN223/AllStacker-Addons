import { ModalFormData, type ModalFormResponse } from "@minecraft/server-ui";
import type { Player } from "@minecraft/server";
import type { IModalFormTextField } from  "@packages/api/src/types/forms/IModalForm/Elements/TextField.ts";
import type { IModalFormToggle } from  "@packages/api/src/types/forms/IModalForm/Elements/Toggle.ts";
import type { IModalFormSlider } from  "@packages/api/src/types/forms/IModalForm/Elements/Slider.ts";
import type { IModalFormDropdown } from  "@packages/api/src/types/forms/IModalForm/Elements/Dropdown.ts";
import type { IModalFormHeader } from  "@packages/api/src/types/forms/IModalForm/Elements/Header.ts";
import type { IModalFormLabel } from  "@packages/api/src/types/forms/IModalForm/Elements/Label.ts";
import type { IModalFormDivider } from  "@packages/api/src/types/forms/IModalForm/Elements/Divider.ts";

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
  private callback?: (
    formValues: (string | number | boolean | undefined)[],
    canceled: boolean,
  ) => void;

  private constructor(title: string = "", submitButtonText: string = "Submit") {
    this.title = title;
    this.submitButtonText = submitButtonText;
  }

  static createForm(
    title: string = "",
    submitButtonText: string = "Submit",
  ): IModalForm {
    return new IModalForm(title, submitButtonText);
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
  public addTextField(textfieldData: {
    label: string;
    placeholderText?: string;
    defaultValue?: string;
    tooltip?: string;
  }, onSubmit: (value: string) => void): this {
    this.elements.push({ ...textfieldData, onSubmit });
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
  public addToggle(
    toggleData: {
      label: string;
      defaultValue?: boolean;
      tooltip?: string;
    },
    onSubmit: (value: boolean) => void,
  ): this {
    this.elements.push({ ...toggleData, onSubmit });
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
    sliderData: {
      label: string;
      minimumValue: number;
      maximumValue: number;
      valueStep: number;
      defaultValue?: number;
      tooltip?: string;
    },
    onSubmit: (value: number) => void,
  ): this {
    this.elements.push({
      ...sliderData,
      onSubmit,
    });
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
  public addDropdown(
    dropdownData: {
      label: string;
      options: string[];
      defaultValueIndex?: number;
      tooltip?: string;
    },
    onSubmit: (value: number) => void,
  ): this {
    this.elements.push({ ...dropdownData, onSubmit });
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
        this.isTextField(element) || this.isToggle(element) ||
        this.isSlider(element) || this.isDropdown(element),
    );
  }

  /**
   * Get all elements
   */
  public getElements(): FormElement[] {
    return this.elements;
  }

  public addCallback(
    callback: (
      formValues: (string | number | boolean | undefined)[],
      canceled: boolean,
    ) => void,
  ): this {
    this.callback = callback;
    return this;
  }

  /**
   * Show the form to a player and return the response
   */
  public async show(player: Player): Promise<ModalFormResponse | undefined> {
    const elementMap = new Map<number, FormElement>();
    const form = new ModalFormData();
    form.title(this.title);
    form.submitButton(this.submitButtonText);

    this.elements.forEach((element, index) => {
      try {
        if (this.isDivider(element)) {
          form.divider();
        } else if (this.isHeader(element)) {
          form.label(element.text_header);
        } else if (this.isLabel(element)) {
          form.label(element.text_label);
        } else if (this.isTextField(element)) {
          const defVal = typeof element.defaultValue === "string" ? element.defaultValue : String(element.defaultValue ?? "");
          form.textField(element.label, element.placeholderText || "", {
            defaultValue: defVal,
            tooltip: element.tooltip,
          });
        } else if (this.isToggle(element)) {
          const defBool = element.defaultValue === true;
          form.toggle(element.label, {
            defaultValue: defBool,
            tooltip: element.tooltip,
          });
        } else if (this.isSlider(element)) {
          const minVal = Number(element.minimumValue ?? 0);
          const maxVal = Number(element.maximumValue ?? 100);
          const rawDefault = Number(element.defaultValue ?? minVal);
          const clampedDefault = Number.isFinite(rawDefault)
            ? Math.max(minVal, Math.min(maxVal, rawDefault))
            : minVal;
          console.log(`[IModalForm] slider "${element.label}" min=${minVal} max=${maxVal} default=${clampedDefault} (raw=${element.defaultValue})`);
          form.slider(element.label, minVal, maxVal, {
            defaultValue: clampedDefault,
            valueStep: Number(element.valueStep ?? 1),
            tooltip: element.tooltip,
          });
        } else if (this.isDropdown(element)) {
          form.dropdown(element.label, element.options, {
            defaultValueIndex: element.defaultValueIndex || 0,
            tooltip: element.tooltip,
          });
        }
        elementMap.set(index, element);
      } catch (e) {
        console.error(`[IModalForm] Failed to add element[${index}] type=${JSON.stringify(Object.keys(element))} value=${JSON.stringify(element)}:`, e);
      }
    });

    try {
      const response = await form.show(player);
      if (!response.canceled) {
        const values = response.formValues || [];
        // Build an ordered list of ONLY interactive elements (same order as added to MCBE form)
        // so that formValues[i] correctly maps to the right onSubmit handler.
        const interactiveElements = Array.from(elementMap.values()).filter(
          (el) => this.isTextField(el) || this.isToggle(el) || this.isSlider(el) || this.isDropdown(el)
        );
        interactiveElements.forEach((element, index) => {
          if (this.isTextField(element)) {
            element.onSubmit(values[index] as string);
          } else if (this.isToggle(element)) {
            element.onSubmit(values[index] as boolean);
          } else if (this.isSlider(element)) {
            element.onSubmit(values[index] as number);
          } else if (this.isDropdown(element)) {
            element.onSubmit(values[index] as number);
          }
        });
      }
      return response;
    } catch (error) {
      console.error("Error showing modal form:", error);
      throw error;
    }
  }

  // Type guard methods for better type safety
  private isTextField(element: FormElement): element is IModalFormTextField {
    return "label" in element && "placeholderText" in element;
  }

  private isToggle(element: FormElement): element is IModalFormToggle {
    return "label" in element && "defaultValue" in element &&
      typeof element.defaultValue === "boolean";
  }

  private isSlider(element: FormElement): element is IModalFormSlider {
    return "minimumValue" in element && "maximumValue" in element &&
      "valueStep" in element;
  }

  private isDropdown(element: FormElement): element is IModalFormDropdown {
    return "options" in element && Array.isArray(element.options);
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

export { IModalForm };
