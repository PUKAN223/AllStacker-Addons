import { ActionFormData, ActionFormResponse } from "npm:@minecraft/server-ui@2.0.0";
import { IActionFormButton, IActionFormDivider, IActionFormHeader, IActionFormLabel } from "@kisu/api";
import { Player } from "@minecraft/server";

type FormElement = IActionFormButton | IActionFormDivider | IActionFormHeader | IActionFormLabel;

class IActionForm {
  private title: string;
  private body: string;
  private elements: FormElement[] = [];
  private previousForm?: (pl: Player) => void;

  constructor(title: string = "", body: string = "", previousForm?: (pl: Player) => void) {
    this.title = title;
    this.body = body;
    if (previousForm) {
      this.previousForm = previousForm;
    }
  }

  public back(pl: Player) {
    if (this.previousForm) this.previousForm(pl);
    return;
  }

  /**
   * Set the form title
   */
  public setTitle(title: string): this {
    this.title = title;
    return this;
  }

  /**
   * Set the form body text
   */
  public setBody(body: string): this {
    this.body = body;
    return this;
  }

  /**
   * Get the current title
   */
  public getTitle(): string {
    return this.title;
  }

  /**
   * Get the current body text
   */
  public getBody(): string {
    return this.body;
  }

  /**
   * Add multiple buttons at once
   */
  public addButtons(buttons: IActionFormButton[]): this {
    this.elements.push(...buttons);
    return this;
  }

  /**
   * Add a single button
   */
  public addButton(label: string, icon?: string, onClick?: () => void): this {
    this.elements.push({ label, icon, onClick });
    return this;
  }

  /**
   * Add a button object
   */
  public addButtonObject(button: IActionFormButton): this {
    this.elements.push(button);
    return this;
  }

  /**
   * Get all buttons from the form
   */
  public getButtons(): IActionFormButton[] {
    return this.elements.filter(this.isButton);
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
  public getDividers(): IActionFormDivider[] {
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
  public addHeaderObject(header: IActionFormHeader): this {
    this.elements.push(header);
    return this;
  }

  /**
   * Get the first header from the form
   */
  public getHeader(): IActionFormHeader | undefined {
    return this.elements.find(this.isHeader);
  }

  /**
   * Get all headers from the form
   */
  public getHeaders(): IActionFormHeader[] {
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
  public addLabelObject(label: IActionFormLabel): this {
    this.elements.push(label);
    return this;
  }

  /**
   * Get all labels from the form
   */
  public getLabels(): IActionFormLabel[] {
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
   * Check if the form has any buttons
   */
  public hasButtons(): boolean {
    return this.getButtons().length > 0;
  }

  /**
   * Show the form to a player
   */
  public async show(player: Player): Promise<ActionFormResponse> {
    const form = new ActionFormData();
    form.title(this.title);
    form.body(this.body);

    // Track button indices for callback handling
    let buttonIndex = 0;
    const buttonCallbacks: (() => void)[] = [];

    this.elements.forEach((element) => {
      if (this.isDivider(element)) {
        form.divider();
      } else if (this.isHeader(element)) {
        form.header(element.text_header);
      } else if (this.isLabel(element)) {
        form.label(element.text_label);
      } else if (this.isButton(element)) {
        form.button(element.label, element.icon);
        buttonCallbacks[buttonIndex] = element.onClick || (() => {});
        buttonIndex++;
      }
    });

    form.body(this.body);

    try {
      const response = await form.show(player);

      if (!response.canceled && response.selection !== undefined) {
        const callback = buttonCallbacks[response.selection];
        if (callback) {
          callback();
        }
      }

      return response;
    } catch (error) {
      console.error("Error showing form:", error);
      throw error;
    }
  }

  private isButton(element: FormElement): element is IActionFormButton {
    return "label" in element;
  }

  private isDivider(element: FormElement): element is IActionFormDivider {
    return "divider" in element && element.divider === true;
  }

  private isHeader(element: FormElement): element is IActionFormHeader {
    return "text_header" in element;
  }

  private isLabel(element: FormElement): element is IActionFormLabel {
    return "text_label" in element;
  }
}

export { IActionForm };
