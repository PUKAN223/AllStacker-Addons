import { MessageFormData, MessageFormResponse } from "npm:@minecraft/server-ui@2.0.0";
import { Player } from "@minecraft/server";
import { IMessageFormButton } from "@kisu/api"

type FormElement = IMessageFormButton;

class IMessageForm {
  private title: string;
  private body: string;
  private button1: IMessageFormButton | null = null;
  private button2: IMessageFormButton | null = null;

  constructor(title: string = "", body: string = "") {
    this.title = title;
    this.body = body;
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
   * Set button 1 (left button)
   */
  public setButton1(text: string, onClick?: () => void): this {
    this.button1 = { text, onClick };
    return this;
  }

  /**
   * Set button 1 object
   */
  public setButton1Object(button: IMessageFormButton): this {
    this.button1 = button;
    return this;
  }

  /**
   * Set button 2 (right button)
   */
  public setButton2(text: string, onClick?: () => void): this {
    this.button2 = { text, onClick };
    return this;
  }

  /**
   * Set button 2 object
   */
  public setButton2Object(button: IMessageFormButton): this {
    this.button2 = button;
    return this;
  }

  /**
   * Get button 1
   */
  public getButton1(): IMessageFormButton | null {
    return this.button1;
  }

  /**
   * Get button 2
   */
  public getButton2(): IMessageFormButton | null {
    return this.button2;
  }

  /**
   * Check if button 1 is set
   */
  public hasButton1(): boolean {
    return this.button1 !== null;
  }

  /**
   * Check if button 2 is set
   */
  public hasButton2(): boolean {
    return this.button2 !== null;
  }

  /**
   * Check if any buttons are set
   */
  public hasButtons(): boolean {
    return this.button1 !== null || this.button2 !== null;
  }

  /**
   * Clear all buttons
   */
  public clearButtons(): this {
    this.button1 = null;
    this.button2 = null;
    return this;
  }

  /**
   * Clear button 1
   */
  public clearButton1(): this {
    this.button1 = null;
    return this;
  }

  /**
   * Clear button 2
   */
  public clearButton2(): this {
    this.button2 = null;
    return this;
  }

  /**
   * Show the form to a player and return the response
   */
  public async show(player: Player): Promise<MessageFormResponse> {
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
      const response = await form.show(player);

      // Handle button callbacks
      if (!response.canceled && response.selection !== undefined) {
        if (response.selection === 0 && this.button1 && this.button1.onClick) {
          this.button1.onClick();
        } else if (response.selection === 1 && this.button2 && this.button2.onClick) {
          this.button2.onClick();
        }
      }

      return response;
    } catch (error) {
      console.error("Error showing message form:", error);
      throw error;
    }
  }

  /**
   * Show the form and process the results with a callback
   */
  public async showWithCallback(
    player: Player,
    callback: (selection: number | undefined, canceled: boolean) => void
  ): Promise<void> {
    try {
      const response = await this.show(player);

      if (response.canceled) {
        callback(undefined, true);
      } else {
        callback(response.selection, false);
      }
    } catch (error) {
      console.error("Error in showWithCallback:", error);
      callback(undefined, true);
    }
  }

  /**
   * Create a simple confirmation dialog
   */
  public static createConfirmation(
    title: string,
    body: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ): IMessageForm {
    return new IMessageForm(title, body).setButton1("Cancel", onCancel).setButton2("Confirm", onConfirm);
  }

  /**
   * Create a simple yes/no dialog
   */
  public static createYesNo(title: string, body: string, onYes?: () => void, onNo?: () => void): IMessageForm {
    return new IMessageForm(title, body).setButton1("No", onNo).setButton2("Yes", onYes);
  }

  /**
   * Create a simple OK dialog
   */
  public static createOK(title: string, body: string, onOK?: () => void): IMessageForm {
    return new IMessageForm(title, body).setButton1("OK", onOK);
  }

  /**
   * Create a simple alert dialog
   */
  public static createAlert(title: string, body: string, onClose?: () => void): IMessageForm {
    return new IMessageForm(title, body).setButton1("Close", onClose);
  }
}

export { IMessageForm };
