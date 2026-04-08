// packs/scripts/kisux3/plugins/ItemStacker/index.ts
import { system as system5, world as world8 } from "@minecraft/server";

// packs/scripts/core/events/index.ts
import { system, world } from "@minecraft/server";

// packs/scripts/core/class/PluginManagers.ts
var PluginManager = class _PluginManager {
  plugins = [];
  static instance;
  constructor() {
  }
  static isEnabled(plugin) {
    const pluginInstance = _PluginManager.getInstance().getPluginByName(plugin);
    if (!pluginInstance) {
      throw new Error(`Plugin with name ${plugin} is not registered.`);
    }
    return pluginInstance.setting.enabled;
  }
  static getInstance() {
    if (!_PluginManager.instance) {
      _PluginManager.instance = new _PluginManager();
    }
    return _PluginManager.instance;
  }
  registerPlugin(plugin) {
    if (this.plugins.find((p) => p.name === plugin.name)) {
      throw new Error(`Plugin with name ${plugin.name} is already registered.`);
    }
    this.plugins.push(plugin);
  }
  registerPlugins(plugins) {
    plugins.forEach((plugin) => this.registerPlugin(plugin));
  }
  unregisterPlugin(pluginName) {
    const index = this.plugins.findIndex((plugin) => plugin.name === pluginName);
    if (index === -1) {
      throw new Error(`Plugin with name ${pluginName} is not registered.`);
    }
    this.plugins.splice(index, 1);
  }
  getPlugins() {
    return this.plugins;
  }
  getPluginByName(name) {
    return this.plugins.find((plugin) => plugin.name === name);
  }
  loadPlugins(plugins, ev) {
    plugins.forEach((plugin) => {
      if (!plugin.setting.enabled) return;
      plugin.main.onLoad(ev);
    });
  }
  startupPlugins(plugins, ev) {
    plugins.forEach((plugin) => {
      if (!plugin.setting.enabled) return;
      plugin.main.onStartup(ev);
    });
  }
  shutdownPlugins(plugins, ev) {
    plugins.forEach((plugin) => {
      if (!plugin.setting.enabled) return;
      plugin.main.onShutdown(ev);
    });
  }
};

// packs/scripts/core/class/EventEmitter.ts
var KXEvents = class {
  static events = /* @__PURE__ */ new Map();
  static on(plugin, eventName, callback) {
    if (plugin === null) {
      const key2 = "__global__";
      if (!this.events.has(key2)) {
        this.events.set(key2, /* @__PURE__ */ Object.create(null));
      }
      const pluginEvents2 = this.events.get(key2);
      if (!pluginEvents2[eventName]) {
        pluginEvents2[eventName] = [];
      }
      pluginEvents2[eventName].push(callback);
      return;
    }
    if (!PluginManager.isEnabled(plugin.getName())) return;
    const key = plugin.getName();
    if (!this.events.has(key)) {
      this.events.set(key, /* @__PURE__ */ Object.create(null));
    }
    const pluginEvents = this.events.get(key);
    if (!pluginEvents[eventName]) {
      pluginEvents[eventName] = [];
    }
    pluginEvents[eventName].push(callback);
  }
  // deno-lint-ignore no-explicit-any
  static emit(plugin, eventName, data) {
    if (plugin === null) {
      const globalEvents = this.events.get("__global__");
      if (globalEvents) {
        const callbacks2 = globalEvents[eventName];
        if (callbacks2) {
          for (const cb of callbacks2) {
            try {
              cb(data);
            } catch (err) {
              console.error(`[KXEvents] Error in global event "${eventName}":`, err.stack);
            }
          }
        }
      }
      for (const [key2, pluginEvents2] of this.events.entries()) {
        if (key2 === "__global__") continue;
        if (!PluginManager.isEnabled(key2)) continue;
        const callbacks2 = pluginEvents2[eventName];
        if (!callbacks2) continue;
        for (const cb of callbacks2) {
          try {
            cb(data);
          } catch (err) {
            console.error(`[KXEvents] Error in event "${eventName}" from ${key2}:`, err.stack);
          }
        }
      }
      return;
    }
    if (!PluginManager.isEnabled(plugin.getName())) return;
    const key = plugin.getName();
    const pluginEvents = this.events.get(key);
    if (!pluginEvents) return;
    const callbacks = pluginEvents[eventName];
    if (!callbacks) return;
    for (const cb of callbacks) {
      try {
        cb(data);
      } catch (err) {
        console.error(`[KXEvents] Error in event "${eventName}" from ${plugin.getName()}:`, err.stack);
      }
    }
  }
};

// packs/scripts/core/events/index.ts
function initializeEvents() {
  const afterEvents = [];
  const beforeEvents = [];
  const systemBeforeEvents = [];
  const systemAfterEvents = [];
  for (const key in world.beforeEvents) {
    beforeEvents.push(key);
  }
  for (const key in world.afterEvents) {
    afterEvents.push(key);
  }
  for (const key in system.beforeEvents) {
    systemBeforeEvents.push(key);
  }
  for (const key in system.afterEvents) {
    systemAfterEvents.push(key);
  }
  afterEvents.forEach((event) => {
    world.afterEvents[event].subscribe((ev) => {
      KXEvents.emit(null, `after:${event}`, ev);
    });
  });
  beforeEvents.forEach((event) => {
    world.beforeEvents[event].subscribe((ev) => {
      KXEvents.emit(null, `before:${event}`, ev);
    });
  });
  systemAfterEvents.forEach((event) => {
    system.afterEvents[event].subscribe((ev) => {
      KXEvents.emit(null, `after:${event}`, ev);
    });
  });
  systemBeforeEvents.forEach((event) => {
    system.beforeEvents[event].subscribe((ev) => {
      KXEvents.emit(null, `before:${event}`, ev);
    });
  });
  system.runInterval(() => {
    KXEvents.emit(null, "after:tick", { currentTick: system.currentTick });
  });
}

// packs/scripts/core/class/ItemConverter.ts
import { ItemLockMode, ItemStack } from "@minecraft/server";
var ItemConverter = class _ItemConverter {
  static instance;
  static isLoaded = false;
  constructor() {
    if (_ItemConverter.instance) {
      return _ItemConverter.instance;
    }
    _ItemConverter.instance = this;
    _ItemConverter.isLoaded = true;
  }
  static getInstance() {
    if (!_ItemConverter.instance) {
      _ItemConverter.instance = new _ItemConverter();
    }
    return _ItemConverter.instance;
  }
  ItemToJson(item) {
    const itemDynamic = [];
    let itemDurability = 0;
    let itemEnchantment = [];
    if (item.getDynamicPropertyIds().length !== 0) {
      item.getDynamicPropertyIds().forEach((ids) => {
        itemDynamic.push({ id: ids, data: item.getDynamicProperty(ids) });
      });
    }
    if (item.getComponent("durability") && item.getComponent("durability").damage !== 0) {
      itemDurability = item.getComponent("durability").damage;
    }
    if (item.getComponent("enchantable") && item.getComponent("enchantable").getEnchantments().length !== 0) {
      itemEnchantment = item.getComponent("enchantable").getEnchantments();
    }
    const data = {
      typeId: item.typeId,
      amount: item.amount,
      keepOnDeath: item.keepOnDeath,
      lockMode: item.lockMode,
      maxAmount: item.maxAmount,
      nameTag: item.nameTag,
      dynamicProperty: itemDynamic ?? void 0,
      lores: item.getLore(),
      can_destroy: item.getCanDestroy(),
      can_placeon: item.getCanPlaceOn(),
      durability: itemDurability,
      enchants: itemEnchantment ?? []
    };
    return data;
  }
  JsonToItem(itemJson) {
    const items = new ItemStack(itemJson.typeId, itemJson.amount);
    try {
      items.setCanDestroy(itemJson.can_destroy);
      items.setCanPlaceOn(itemJson.can_placeon);
      if (itemJson.durability) {
        items.getComponent("durability").damage = itemJson.durability;
      }
      itemJson.dynamicProperty.forEach(({ id, data }) => {
        items.setDynamicProperty(id, data);
      });
      if (itemJson.enchants) {
        itemJson.enchants.forEach((enc) => {
          items.getComponent("enchantable").addEnchantment({ type: enc.type, level: enc.level });
        });
      }
      items.keepOnDeath = itemJson.keepOnDeath ?? false;
      items.lockMode = ItemLockMode[itemJson.lockMode];
      items.setLore(itemJson.lores);
      items.nameTag = itemJson.nameTag;
      return items;
    } catch (_error) {
      return items;
    }
  }
};
var ItemConvert = ItemConverter.getInstance();

// packs/scripts/core/class/Logger.ts
var Logger = class _Logger {
  static instance;
  constructor() {
  }
  static getInstance() {
    if (!_Logger.instance) {
      _Logger.instance = new _Logger();
    }
    return _Logger.instance;
  }
  log(message) {
    console.info(`[ LOG ] ${message}`);
  }
  error(message) {
    console.info(`[ ERROR ] ${message}`);
  }
  warn(message) {
    console.info(`[ WARN ] ${message}`);
  }
  debug(message) {
    console.info(`[ DEBUG ] ${message}`);
  }
  info(message) {
    console.info(`[ INFO ] ${message}`);
  }
};

// packs/scripts/core/class/forms/IActionForm.ts
import { ActionFormData } from "@minecraft/server-ui";
var IActionForm = class {
  title;
  body;
  elements = [];
  constructor(title = "", body = "") {
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
  async show(player) {
    const form = new ActionFormData();
    form.title(this.title);
    form.body(this.body);
    let buttonIndex = 0;
    const buttonCallbacks = [];
    this.elements.forEach((element) => {
      if (this.isDivider(element)) {
        form.divider();
      } else if (this.isHeader(element)) {
        form.header(element.text_header);
      } else if (this.isLabel(element)) {
        form.label(element.text_label);
      } else if (this.isButton(element)) {
        form.button(element.label, element.icon);
        buttonCallbacks[buttonIndex] = element.onClick || (() => {
        });
        buttonIndex++;
      }
    });
    form.body(this.body);
    try {
      const response = await form.show(player);
      if (!response.canceled && response.selection !== void 0) {
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
  isButton(element) {
    return "label" in element;
  }
  isDivider(element) {
    return "divider" in element && element.divider === true;
  }
  isHeader(element) {
    return "text_header" in element;
  }
  isLabel(element) {
    return "text_label" in element;
  }
};
var IActionForm_default = IActionForm;

// packs/scripts/core/class/forms/IMessageForm.ts
import { MessageFormData } from "@minecraft/server-ui";
var IMessageForm = class _IMessageForm {
  title;
  body;
  button1 = null;
  button2 = null;
  constructor(title = "", body = "") {
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
  async show(player) {
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
      if (!response.canceled && response.selection !== void 0) {
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
  async showWithCallback(player, callback) {
    try {
      const response = await this.show(player);
      if (response.canceled) {
        callback(void 0, true);
      } else {
        callback(response.selection, false);
      }
    } catch (error) {
      console.error("Error in showWithCallback:", error);
      callback(void 0, true);
    }
  }
  /**
   * Create a simple confirmation dialog
   */
  static createConfirmation(title, body, onConfirm, onCancel) {
    return new _IMessageForm(title, body).setButton1("Cancel", onCancel).setButton2("Confirm", onConfirm);
  }
  /**
   * Create a simple yes/no dialog
   */
  static createYesNo(title, body, onYes, onNo) {
    return new _IMessageForm(title, body).setButton1("No", onNo).setButton2("Yes", onYes);
  }
  /**
   * Create a simple OK dialog
   */
  static createOK(title, body, onOK) {
    return new _IMessageForm(title, body).setButton1("OK", onOK);
  }
  /**
   * Create a simple alert dialog
   */
  static createAlert(title, body, onClose) {
    return new _IMessageForm(title, body).setButton1("Close", onClose);
  }
};
var IMessageForm_default = IMessageForm;

// packs/scripts/core/class/forms/IModalForm.ts
import { ModalFormData } from "@minecraft/server-ui";
var IModalForm = class {
  title;
  elements = [];
  submitButtonText;
  // deno-lint-ignore no-explicit-any
  callback;
  constructor(title = "", submitButtonText = "Submit") {
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
    return this.elements.some(
      (element) => this.isTextField(element) || this.isToggle(element) || this.isSlider(element) || this.isDropdown(element)
    );
  }
  /**
   * Get all elements
   */
  getElements() {
    return this.elements;
  }
  // deno-lint-ignore no-explicit-any
  addCallback(callback) {
    this.callback = callback;
    return this;
  }
  /**
   * Show the form to a player and return the response
   */
  async show(player) {
    const form = new ModalFormData();
    form.title(this.title);
    form.submitButton(this.submitButtonText);
    this.elements.forEach((element) => {
      if (this.isDivider(element)) {
        form.divider();
      } else if (this.isHeader(element)) {
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
          valueStep: element.valueStep
        });
      } else if (this.isDropdown(element)) {
        form.dropdown(element.label, element.options, { defaultValueIndex: element.defaultValueIndex || 0 });
      }
    });
    try {
      const response = await form.show(player);
      return response;
    } catch (error) {
      console.error("Error showing modal form:", error);
      throw error;
    }
  }
  /**
   * Show the form and process the results with a callback
   */
  async showWithCallback(player) {
    try {
      const response = await this.show(player);
      if (response.canceled) {
        this.callback?.([], true);
      } else {
        this.callback?.(response.formValues || [], false);
      }
    } catch (error) {
      console.error("Error in showWithCallback:", error);
      this.callback?.([], true);
    }
  }
  // Type guard methods for better type safety
  isTextField(element) {
    return "label" in element && "placeholderText" in element;
  }
  isToggle(element) {
    return "label" in element && "defaultValue" in element && typeof element.defaultValue === "boolean";
  }
  isSlider(element) {
    return "minimumValue" in element && "maximumValue" in element && "valueStep" in element;
  }
  isDropdown(element) {
    return "options" in element && Array.isArray(element.options);
  }
  isDivider(element) {
    return "divider" in element && element.divider === true;
  }
  isHeader(element) {
    return "text_header" in element;
  }
  isLabel(element) {
    return "text_label" in element;
  }
};
var IModalForm_default = IModalForm;

// packs/scripts/core/class/PageBuilders.ts
var PageBuilderData = {};
var PageBuilder = class {
  id;
  pages = {};
  constructor(id) {
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
  async showPage(player, pageId) {
    const page = this.getPages()[pageId];
    if (!page) {
      return await Promise.reject(new Error(`Page with ID ${pageId} does not exist`));
    }
    if (page instanceof IActionForm_default) {
      return page.show(player).then(() => {
      });
    } else if (page instanceof IMessageForm_default) {
      return page.show(player).then(() => {
      });
    } else if (page instanceof IModalForm_default) {
      return page.showWithCallback(player).then(() => {
      });
    } else {
      return await Promise.reject(new Error("Unknown form type"));
    }
  }
};

// packs/scripts/core/class/PluginBase.ts
var PluginBase = class {
  name;
  description;
  version;
  logger;
  constructor(name, description, version) {
    this.name = name;
    this.description = description;
    this.version = version;
    this.logger = Logger.getInstance();
  }
  getConfig() {
    const plugin = PluginLoader.find((plugin2) => plugin2.name === this.name);
    if (!plugin) return {};
    return plugin.setting.config;
  }
  getName() {
    return this.name;
  }
  onLoad(ev) {
    void ev;
  }
  onStartup(ev) {
    void ev;
  }
  onShutdown(ev) {
    void ev;
  }
  addConfig(pl, page, showUI = true) {
    pl;
    page;
    showUI;
    return false;
  }
};

// packs/scripts/core/database/Database.js
import { world as world2, World, Entity, system as system2 } from "@minecraft/server";
import * as mc from "@minecraft/server";
var mc_world = world2;
var { setDynamicProperty: wSDP, getDynamicProperty: wGDP, getDynamicPropertyIds: wGDPI } = World.prototype;
var { isValid: isValidEntity, setDynamicProperty: eSDP, getDynamicProperty: eGDP, getDynamicPropertyIds: eGDPI } = Entity.prototype;
var DYNAMIC_DB_PREFIX = "\u1221\u2112";
var ROOT_CONTENT_TABLE_UUID = "c0211201-0001-4001-8001-4f90af596647";
var STRING_LIMIT = 32e3;
var TABLE_STRING_LENGTH = 31e3;
var GENERATOR_DESERIALIZER_SYMBOL = Symbol("DESERIALIZER");
var eP = {
  gDP: eGDP,
  sDP: eSDP,
  gDPI: eGDPI
};
var wP = {
  gDP: wGDP,
  sDP: wSDP,
  gDPI: wGDPI
};
var DynamicSource = class {
  /**@readonly @type {World | Entity} */
  source;
  /**@param {World | Entity} source  */
  constructor(source) {
    this.source = source;
    if (SOURCE_INSTANCES.has(source)) return SOURCE_INSTANCES.get(source);
    if (source === mc_world) Object.assign(this, wP);
    else if (isValidEntity.call(source)) Object.assign(this, eP);
    else throw new ReferenceError("Invald source type: " + source);
    SOURCE_INSTANCES.set(source, this);
  }
  /**@returns {string[]} */
  getIds() {
    return this.gDPI.call(this.source);
  }
  /**@param {string} key  @returns {number | boolean | string | import("npm:@minecraft/server@2.3.0").Vector3}*/
  get(key) {
    return this.gDP.call(this.source, key);
  }
  /**@param {string} key */
  set(key, value) {
    this.sDP.call(this.source, key, value);
  }
  /**@param {string} key @returns {boolean}  */
  delete(key) {
    this.sDP.call(this.source, key, void 0);
    return true;
  }
  /**@returns {boolean}  */
  isValid() {
    return this.source === world2 || isValidEntity.call(this.source);
  }
};
var SOURCE_INSTANCES = /* @__PURE__ */ new WeakMap();
var DDB_SUBINSTANCES = /* @__PURE__ */ new WeakMap();
var DynamicDatabase = class extends Map {
  /**@readonly @private @type {DynamicSource} */
  _source;
  /**@readonly @private @type {string} */
  _prefix;
  /**@readonly @private @type {string} */
  _prefixLength;
  /**@readonly @private */
  _STRINGIFY;
  /**@readonly @private*/
  _PARSE;
  /** @private*/
  _notDisposed;
  /**@param {World | Entity} source @param {string} id @param {string} kind   */
  constructor(source, id, kind, parser) {
    super();
    this._source = new DynamicSource(source);
    const PRE = `${kind}${DYNAMIC_DB_PREFIX}${id}${DYNAMIC_DB_PREFIX}`, LENGTH = PRE.length, SOURCE = this._source, PARSE = parser.parse;
    const MAP_INSTANCES = DDB_SUBINSTANCES.get(SOURCE) ?? /* @__PURE__ */ new Map();
    if (MAP_INSTANCES.has(PRE)) return MAP_INSTANCES.get(PRE);
    MAP_INSTANCES.set(PRE, this);
    DDB_SUBINSTANCES.set(SOURCE, MAP_INSTANCES);
    if (!SOURCE.isValid()) throw new ReferenceError("Source is no longer valid: " + SOURCE.source);
    this._prefix = PRE;
    this._prefixLength = LENGTH;
    this._STRINGIFY = parser.stringify;
    this._notDisposed = true;
    for (const K of SOURCE.getIds()) if (K.startsWith(PRE)) {
      const key = K.substring(LENGTH);
      const value = SOURCE.get(K);
      if (typeof value === "string") super.set(key, PARSE(value));
    }
  }
  /**@param {string} key @param {any} value */
  set(key, value) {
    if (!this.isValid()) throw new ReferenceError("This database instance is no longer valid");
    if (key.length + this._prefixLength > STRING_LIMIT) throw new TypeError("Key is too long: " + key.length);
    if (value === void 0) {
      this.delete(key);
      return this;
    }
    const data = this._STRINGIFY(value);
    if (data.length > STRING_LIMIT) throw new TypeError("Size of data in string is too long: " + data.length);
    this._source.set(this._prefix + key, data);
    return super.set(key, value);
  }
  /**@param {string} key  */
  delete(key) {
    if (!this.isValid()) throw new ReferenceError("This database instance is no longer valid");
    if (!this.has(key)) return false;
    this._source.delete(this._prefix + key);
    return super.delete(key);
  }
  clear() {
    if (!this.isValid()) throw new ReferenceError("This database instance is no longer valid");
    const P = this._prefix;
    const s = this._source;
    for (const key of this.keys()) s.delete(P + key);
    return super.clear();
  }
  /**@returns {boolean} */
  isValid() {
    return this._source.isValid() && this._notDisposed;
  }
  dispose() {
    this._notDisposed = false;
    DDB_SUBINSTANCES.get(this._source)?.delete?.(this._prefix);
    super.clear();
  }
  /**@readonly @type {boolean} */
  get isDisposed() {
    return !this._notDisposed;
  }
};
var JsonDatabase = class extends DynamicDatabase {
  constructor(id, source = world2) {
    super(source, id, "JSON", JSON);
  }
};
var PARSER_SYMBOL = Symbol("SERIALIZEABLE");
var SERIALIZERS = /* @__PURE__ */ new Map();
var DESERIALIZER_INFO = /* @__PURE__ */ new WeakMap();
var ROOT_KEY = "root::" + ROOT_CONTENT_TABLE_UUID;
var TABLE_SOURCES = /* @__PURE__ */ new WeakMap();
var TABLE_ID = /* @__PURE__ */ new WeakMap();
var ID_TABLE = /* @__PURE__ */ new WeakMap();
var TABLE_VALIDS = /* @__PURE__ */ new WeakSet();
var isNativeCall = false;
var RootTable;
function getRootTable() {
  if (RootTable) return RootTable;
  return RootTable = world2.getDynamicProperty(ROOT_KEY) ? DATABASE_MANAGER.deserialize(ROOT_KEY, new DynamicSource(world2)) : (() => {
    const source = new DynamicSource(world2);
    isNativeCall = true;
    const value = new DynamicTable();
    isNativeCall = false;
    TABLE_SOURCES.set(value, source);
    TABLE_ID.set(value, ROOT_KEY);
    SetTable(source, ROOT_KEY, value);
    TABLE_VALIDS.add(value);
    DATABASE_MANAGER.serialize(ROOT_KEY, source, value);
    return value;
  })();
}
var SerializableKinds = {
  Boolean: "c0211201-0001-4002-8001-4f90af596647",
  Number: "c0211201-0001-4002-8002-4f90af596647",
  String: "c0211201-0001-4002-8003-4f90af596647",
  Object: "c0211201-0001-4002-8004-4f90af596647",
  DynamicTable: "c0211201-0001-4002-8101-4f90af596647"
};
SerializableKinds[SerializableKinds.Boolean] = "Boolean";
SerializableKinds[SerializableKinds.Number] = "Number";
SerializableKinds[SerializableKinds.String] = "String";
SerializableKinds[SerializableKinds.Object] = "Object";
SerializableKinds[SerializableKinds.DynamicTable] = "DynamicTable";
var Serializer = {
  isSerializable(object) {
    return object[PARSER_SYMBOL] != void 0;
  },
  getSerializerKind(object) {
    return object[PARSER_SYMBOL];
  },
  isRegistredKind(kind) {
    return SERIALIZERS.has(kind);
  },
  setSerializableKind(object, kind) {
    if (SERIALIZERS.has(kind)) {
      object[PARSER_SYMBOL] = kind;
      return true;
    }
    return false;
  },
  registrySerializer(kind, serializer, deserializer) {
    if (SERIALIZERS.has(kind)) throw new ReferenceError("Duplicate serialization kind: " + kind);
    if (typeof kind != "string") throw new TypeError("Kind must be type of string.");
    if (typeof serializer != "function" || typeof deserializer != "function") throw new TypeError("serializer or deserializer is not a function");
    SERIALIZERS.set(kind, { serializer, deserializer });
    return kind;
  },
  getSerializer(kind) {
    return SERIALIZERS.get(kind)?.serializer ?? null;
  },
  getDeserializer(kind) {
    return SERIALIZERS.get(kind)?.deserializer ?? null;
  },
  getSerializers(kind) {
    const data = SERIALIZERS.get(kind);
    if (!data) return null;
    return { ...data };
  },
  setSerializableClass(construct, kind, serializer, deserializer) {
    if (typeof serializer !== "function" || typeof deserializer !== "function") throw new TypeError("Serializer or deserializer is not a function");
    Serializer.registrySerializer(kind, function(obj) {
      if (obj == null) throw new TypeError("Null or Undefined is not possible to serialize.");
      return serializer(obj);
    }, function(obj) {
      if (obj[GENERATOR_DESERIALIZER_SYMBOL] !== true) throw new TypeError("Null or Undefined is not possible to serialize.");
      return deserializer(obj);
    });
    Serializer.setSerializableKind(construct.prototype, kind);
  },
  getKindFromClass(construct) {
    return construct?.prototype?.[PARSER_SYMBOL] ?? null;
  },
  getSerializerKinds() {
    return SERIALIZERS.keys();
  },
  overrideSerializers(kind, serializer, deserializer) {
    if (typeof kind != "string") throw new TypeError("Kind must be type of string.");
    if (typeof serializer != "function" || typeof deserializer != "function") throw new TypeError("serializer or deserializer is not a function");
    SERIALIZERS.set(kind, { serializer, deserializer });
    return kind;
  }
};
var DATABASE_MANAGER = {
  getHeader(rootRef, source) {
    const data = source.get(rootRef);
    if (typeof data != "string") return null;
    return JSONReadable(data);
  },
  serialize(rootRef, source, object) {
    if (!Serializer.isRegistredKind(Serializer.getSerializerKind(object))) throw new TypeError("object is not serializeable.");
    const kind = Serializer.getSerializerKind(object);
    const serializer = Serializer.getSerializer(kind);
    if (!serializer) throw new ReferenceError("No serializer for " + kind);
    return this.serializationResolver(
      serializer(object, { kind, source, rootRef }),
      rootRef,
      source,
      kind
    );
  },
  /**@param {Generator<object,any,string>} gen  */
  serializationResolver(gen, rootRef, source, kind) {
    const oldHeader = this.getHeader(rootRef, source);
    const prefix = rootRef + "::";
    let oldLength = 0, newLength = 0;
    if (oldHeader) {
      const [data] = oldHeader;
      oldLength = parseInt(data["length"], 36);
    }
    try {
      let genNext = gen.next();
      if (!genNext.done) {
        const headerData = genNext.value + "";
        if (headerData.length > TABLE_STRING_LENGTH) gen.throw(new RangeError("Yielded stirng is too big: " + headerData.length));
        genNext = gen.next();
        while (!genNext.done) {
          const key = prefix + newLength;
          try {
            source.set(key, genNext.value + "");
            newLength++;
          } catch (error) {
            gen.throw(error);
          }
          genNext = gen.next();
        }
        source.set(rootRef, JSONWritable({ length: newLength.toString(36), kind }, headerData));
      }
      return newLength;
    } catch (er) {
      Object.setPrototypeOf(er, DataCoruptionError.prototype);
      er.source = source;
      er.rootKey = rootRef;
      throw er;
    } finally {
      for (let i = newLength; i < oldLength; i++) source.delete(prefix + i);
    }
  },
  deserialize(rootRef, source, header = void 0) {
    try {
      const oldHeader = header ?? this.getHeader(rootRef, source);
      if (!oldHeader) return null;
      const prefix = rootRef + "::";
      const [{ length: le, kind }, data] = oldHeader;
      let length = parseInt(le, 36);
      if (!Serializer.isRegistredKind(kind)) throw new ReferenceError("Unknown parser kind: " + kind);
      const deserializeResolver = Serializer.getDeserializer(kind);
      if (!deserializeResolver) throw new ReferenceError("No deserializer for: " + kind);
      const deserializer = this.deserializer(source, rootRef, prefix, length, data);
      DESERIALIZER_INFO.set(deserializer, {
        source,
        rootRef,
        kind,
        deserializeResolver,
        oldHeader,
        length
      });
      return deserializeResolver(deserializer);
    } catch (error) {
      error.rootKey = rootRef;
      error.source = source;
      throw Object.setPrototypeOf(error, DataCoruptionError);
    }
  },
  *deserializer(source, root, prefix, length, initial) {
    yield initial;
    let i = 0;
    while (i < length) {
      const data = source.get(prefix + i);
      if (!data) throw new DataCoruptionError(source, root, "No continual data at index of " + i);
      yield data;
      i++;
    }
  },
  removeTree(rootRef, source) {
    const oldHeader = this.getHeader(rootRef, source);
    if (!oldHeader) return false;
    const prefix = rootRef + "::";
    const [{ length: le }] = oldHeader;
    let length = parseInt(le, 36);
    if (!isFinite(length)) return false;
    for (let i = 0; i < length; i++) source.delete(prefix + i);
    source.delete(rootRef);
    return true;
  }
};
Object.defineProperties(DATABASE_MANAGER.deserializer.prototype, Object.getOwnPropertyDescriptors({
  [GENERATOR_DESERIALIZER_SYMBOL]: true,
  return() {
    return { done: true };
  },
  continue() {
    return this.next(...arguments).value;
  },
  get source() {
    if (!DESERIALIZER_INFO.has(this)) throw new ReferenceError("Object bound to prototype does not exist.");
    return DESERIALIZER_INFO.get(this).source;
  },
  get rootKey() {
    if (!DESERIALIZER_INFO.has(this)) throw new ReferenceError("Object bound to prototype does not exist.");
    return DESERIALIZER_INFO.get(this).rootRef;
  },
  get length() {
    if (!DESERIALIZER_INFO.has(this)) throw new ReferenceError("Object bound to prototype does not exist.");
    return DESERIALIZER_INFO.get(this).length;
  },
  get kind() {
    if (!DESERIALIZER_INFO.has(this)) throw new ReferenceError("Object bound to prototype does not exist.");
    return DESERIALIZER_INFO.get(this).kind;
  }
}));
var DynamicTable = class _DynamicTable extends Map {
  /**@readonly */
  static get KIND() {
    return "c0211201-0001-4002-8101-4f90af596647";
  }
  /**@readonly @type {string} */
  get tableId() {
    return TABLE_ID.get(this);
  }
  constructor() {
    if (!isNativeCall) throw new ReferenceError("No constructor for " + _DynamicTable.name);
    super();
  }
  get(key) {
    if (!this.isValid()) throw new ReferenceError("Object bound to prototype doesn't not exist at [DynamicTable::get()].");
    if (!this.has(key)) return;
    const source = TABLE_SOURCES.get(this);
    const dataId = super.get(key);
    return DATABASE_MANAGER.deserialize(dataId, source);
  }
  set(key, value) {
    if (!this.isValid()) throw new ReferenceError("Object bound to prototype doesn't not exist at [DynamicTable::get()].");
    if (value == null) throw new ReferenceError("You can not assign property to null or undefined");
    if (!Serializer.isRegistredKind(Serializer.getSerializerKind(value))) throw new TypeError("value is not serializeable.");
    if (value instanceof _DynamicTable) throw new TypeError("You can't set value as DynamicTable please use AddTable");
    const has = this.has(key);
    const source = TABLE_SOURCES.get(this);
    let newKey;
    if (has) {
      newKey = super.get(key);
      const header = DATABASE_MANAGER.getHeader(newKey, source);
      if (header?.[0]?.kind === _DynamicTable.KIND) {
        const a = DATABASE_MANAGER.deserialize(newKey, source, header);
        a.clear();
        TABLE_VALIDS.delete(a);
      }
    } else {
      newKey = "k:" + v4uuid();
      super.set(key, newKey);
      SaveState(this);
    }
    DATABASE_MANAGER.serialize(newKey, source, value);
    return this;
  }
  clear() {
    if (!this.isValid()) throw new ReferenceError("Object bound to prototype doesn't not exist at [DynamicTable::clear()].");
    const source = TABLE_SOURCES.get(this);
    const KIND = _DynamicTable.KIND;
    for (const k of super.keys()) {
      const dataId = super.get(k);
      const header = DATABASE_MANAGER.getHeader(dataId, source);
      if (header?.[0]?.kind === KIND) {
        const a = DATABASE_MANAGER.deserialize(dataId, source, header);
        a.clear();
        TABLE_VALIDS.delete(a);
      }
      DATABASE_MANAGER.removeTree(dataId, source);
    }
    SaveState(this);
    super.clear();
  }
  delete(key) {
    if (!this.isValid()) throw new ReferenceError("Object bound to prototype doesn't not exist at [DynamicTable::delete()].");
    const source = TABLE_SOURCES.get(this);
    if (!this.has(key)) return false;
    const dataId = super.get(key);
    const header = DATABASE_MANAGER.getHeader(dataId, source);
    if (header?.[0]?.kind === _DynamicTable.KIND) {
      const a = DATABASE_MANAGER.deserialize(dataId, source, header);
      a.clear();
      TABLE_VALIDS.delete(a);
    }
    DATABASE_MANAGER.removeTree(dataId, source);
    SaveState(this);
    return super.delete();
  }
  *entries() {
    if (!this.isValid()) throw new ReferenceError("Object bound to prototype doesn't not exist at [DynamicTable::entries()].");
    for (const [k, v] of super.entries()) yield [k, this.get(k)];
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  *values() {
    if (!this.isValid()) throw new ReferenceError("Object bound to prototype doesn't not exist at [DynamicTable::values()].");
    for (const k of super.keys()) yield this.get(k);
  }
  isValid() {
    return !!(TABLE_VALIDS.has(this) && TABLE_SOURCES.get(this)?.isValid?.());
  }
  /**@returns {DynamicTable} */
  static OpenCreate(id) {
    let fromTable = getRootTable();
    let a = fromTable.get(id);
    if (a === void 0) {
      if (!fromTable.isValid()) throw new ReferenceError("Object bound to prototype doesn't not exist at [DynamicTable::get()].");
      if (Map.prototype.has.call(fromTable, id)) throw new ReferenceError("Value of this key already exists");
      const source = TABLE_SOURCES.get(fromTable);
      let newKey = "t" + v4uuid();
      isNativeCall = true;
      const value = new _DynamicTable();
      isNativeCall = false;
      Map.prototype.set.call(fromTable, id, newKey);
      SaveState(fromTable);
      DATABASE_MANAGER.serialize(newKey, source, value);
      TABLE_SOURCES.set(value, source);
      TABLE_ID.set(value, newKey);
      SetTable(source, newKey, value);
      TABLE_VALIDS.add(value);
      a = value;
    } else if (!(a instanceof _DynamicTable)) throw new TypeError(`Value saved in ${id} is not a dynamic table.`);
    return a;
  }
  static ClearAll() {
    getRootTable().clear();
  }
  static getTableIds() {
    return getRootTable().keys();
  }
  static DeleteTable(key) {
    return getRootTable().delete(key);
  }
};
function SaveState(table) {
  if (table._task === void 0) {
    table._task = system2.run(() => {
      table._task = void 0;
      if (table.isValid()) {
        DATABASE_MANAGER.serialize(table.tableId, TABLE_SOURCES.get(table), table);
      }
    });
  }
}
function GetTable(source, rootRef) {
  return ID_TABLE.get(source)?.get(rootRef);
}
function SetTable(source, rootRef, table) {
  if (!ID_TABLE.has(source)) ID_TABLE.set(source, /* @__PURE__ */ new Map());
  ID_TABLE.get(source).set(rootRef, table);
}
var DataCoruptionError = class extends ReferenceError {
  constructor(source, rootKey, message) {
    super(message);
    this.rootKey = rootKey;
    this.source = source;
  }
  remove() {
    if (!this.source.isValid()) throw new ReferenceError("Source is no longer valid");
    DATABASE_MANAGER.removeTree(this.rootKey, this.source);
  }
};
Serializer.setSerializableClass(
  DynamicTable,
  DynamicTable.KIND,
  function* (table) {
    let obj = {}, i = 0;
    const get = Map.prototype.get, maxSize = 300;
    yield Math.ceil(table.size / maxSize);
    for (const key of table.keys()) {
      if (++i >= maxSize) {
        yield JSON.stringify(obj);
        i = 0, obj = {};
      }
      obj[key] = get.call(table, key);
    }
    if (i) yield JSON.stringify(obj);
  },
  function(n) {
    if (GetTable(n.source, n.rootKey)) return GetTable(n.source, n.rootKey);
    isNativeCall = true;
    const table = new DynamicTable();
    isNativeCall = false;
    TABLE_SOURCES.set(table, n.source);
    TABLE_ID.set(table, n.rootKey);
    SetTable(n.source, n.rootKey, table);
    TABLE_VALIDS.add(table);
    const set = Map.prototype.set;
    const length = Number(n.continue());
    for (let i = 0; i < length; i++) {
      const data = n.continue();
      if (!data) throw new DataCoruptionError(n.source, n.rootKey, "Data for this dynamic table are corupted.");
      const obj = JSON.parse(data);
      for (const k of Object.getOwnPropertyNames(obj)) set.call(table, k, obj[k]);
    }
    return table;
  }
);
Serializer.setSerializableClass(Boolean, SerializableKinds.Boolean, function* (n) {
  yield n;
}, function(n) {
  for (const a of n) return a === "true";
});
Serializer.setSerializableClass(Number, SerializableKinds.Number, function* (n) {
  yield n;
}, function(n) {
  for (const a of n) return Number(a);
});
Serializer.setSerializableClass(
  String,
  SerializableKinds.String,
  function* (n) {
    let length = n.length;
    let cursor = 0;
    let i = 0;
    yield Math.ceil(length / TABLE_STRING_LENGTH);
    while (length > 0) {
      const s = n.substring(cursor, cursor + TABLE_STRING_LENGTH);
      const l = s.length;
      if (l <= 0) return;
      length -= l, cursor += l;
      yield s;
      i++;
    }
  },
  function(n) {
    const count = Number(n.continue());
    const l = new Array(count);
    for (let i = 0; i < count; i++) {
      l[i] = n.continue();
    }
    return l.join("");
  }
);
Serializer.setSerializableClass(
  Object,
  SerializableKinds.Object,
  function(n) {
    return Serializer.getSerializer(SerializableKinds.String)(JSON.stringify(n));
  },
  function(n) {
    return JSON.parse(Serializer.getDeserializer(SerializableKinds.String)(n));
  }
);
function v4uuid(timestamp = Date.now()) {
  const { random, floor } = Math;
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    let r = (timestamp + random() * 16) % 16 | 0;
    timestamp = floor(timestamp / 16);
    return (c == "x" ? r : r & 3 | 8).toString(16);
  });
  return uuid;
}
function Readable(text) {
  const size = text.charCodeAt(0);
  const info = text.substring(1, 1 + size);
  const data = text.substring(1 + size);
  return [info, data, size];
}
function JSONReadable(text) {
  const [info, data, size] = Readable(text);
  return [JSON.parse(info), data, size];
}
function Writable(json, text) {
  return `${String.fromCharCode(json.length)}${json}${text}`;
}
function JSONWritable(json, text) {
  return Writable(JSON.stringify(json), text);
}

// packs/scripts/core/index.ts
initializeEvents();

// packs/scripts/kisux3/plugins/ItemStacker/services/utils.ts
import { ItemEnchantableComponent as ItemEnchantableComponent2, ItemStack as ItemStack2, system as system3, world as world5 } from "@minecraft/server";

// packs/scripts/core/utils/EntityManagers.ts
import { DimensionTypes, world as world3 } from "@minecraft/server";
function getEntitiesAtDim(dim, filter) {
  const entities = world3.getDimension(dim).getEntities();
  if (filter) {
    return entities.filter(filter);
  }
  return entities;
}
function getAllEntities(filter) {
  const dims = DimensionTypes.getAll().map((type) => type.typeId);
  const entities = [];
  dims.forEach((dim) => {
    entities.push(...getEntitiesAtDim(dim, filter));
  });
  return entities;
}

// ../../../../AppData/Local/deno/deno_esbuild/registry.npmjs.org/@minecraft/math@2.2.11_@minecraft+server@2.3.0__@minecraft+common@1.2.0__@minecraft+vanilla-data@1.21.124/node_modules/@minecraft/math/lib/general/clamp.js
function clampNumber(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ../../../../AppData/Local/deno/deno_esbuild/registry.npmjs.org/@minecraft/math@2.2.11_@minecraft+server@2.3.0__@minecraft+common@1.2.0__@minecraft+vanilla-data@1.21.124/node_modules/@minecraft/math/lib/vector3/coreHelpers.js
var Vector3Utils = class _Vector3Utils {
  /**
   * equals
   *
   * Check the equality of two vectors
   */
  static equals(v1, v2) {
    return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z;
  }
  /**
   * add
   *
   * Add two vectors to produce a new vector
   */
  static add(v1, v2) {
    return { x: v1.x + (v2.x ?? 0), y: v1.y + (v2.y ?? 0), z: v1.z + (v2.z ?? 0) };
  }
  /**
   * subtract
   *
   * Subtract two vectors to produce a new vector (v1-v2)
   */
  static subtract(v1, v2) {
    return { x: v1.x - (v2.x ?? 0), y: v1.y - (v2.y ?? 0), z: v1.z - (v2.z ?? 0) };
  }
  /** scale
   *
   * Multiple all entries in a vector by a single scalar value producing a new vector
   */
  static scale(v1, scale) {
    return { x: v1.x * scale, y: v1.y * scale, z: v1.z * scale };
  }
  /**
   * dot
   *
   * Calculate the dot product of two vectors
   */
  static dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }
  /**
   * cross
   *
   * Calculate the cross product of two vectors. Returns a new vector.
   */
  static cross(a, b) {
    return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
  }
  /**
   * magnitude
   *
   * The magnitude of a vector
   */
  static magnitude(v) {
    return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
  }
  /**
   * distance
   *
   * Calculate the distance between two vectors
   */
  static distance(a, b) {
    return _Vector3Utils.magnitude(_Vector3Utils.subtract(a, b));
  }
  /**
   * normalize
   *
   * Takes a vector 3 and normalizes it to a unit vector
   */
  static normalize(v) {
    const mag = _Vector3Utils.magnitude(v);
    return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
  }
  /**
   * floor
   *
   * Floor the components of a vector to produce a new vector
   */
  static floor(v) {
    return { x: Math.floor(v.x), y: Math.floor(v.y), z: Math.floor(v.z) };
  }
  /**
   * toString
   *
   * Create a string representation of a vector3
   */
  static toString(v, options) {
    const decimals = options?.decimals ?? 2;
    const str = [v.x.toFixed(decimals), v.y.toFixed(decimals), v.z.toFixed(decimals)];
    return str.join(options?.delimiter ?? ", ");
  }
  /**
   * fromString
   *
   * Gets a Vector3 from the string representation produced by {@link Vector3Utils.toString}. If any numeric value is not a number
   * or the format is invalid, undefined is returned.
   * @param str - The string to parse
   * @param delimiter - The delimiter used to separate the components. Defaults to the same as the default for {@link Vector3Utils.toString}
   */
  static fromString(str, delimiter = ",") {
    const parts = str.split(delimiter);
    if (parts.length !== 3) {
      return void 0;
    }
    const output = parts.map((part) => parseFloat(part));
    if (output.some((part) => isNaN(part))) {
      return void 0;
    }
    return { x: output[0], y: output[1], z: output[2] };
  }
  /**
   * clamp
   *
   * Clamps the components of a vector to limits to produce a new vector
   */
  static clamp(v, limits) {
    return {
      x: clampNumber(v.x, limits?.min?.x ?? Number.MIN_SAFE_INTEGER, limits?.max?.x ?? Number.MAX_SAFE_INTEGER),
      y: clampNumber(v.y, limits?.min?.y ?? Number.MIN_SAFE_INTEGER, limits?.max?.y ?? Number.MAX_SAFE_INTEGER),
      z: clampNumber(v.z, limits?.min?.z ?? Number.MIN_SAFE_INTEGER, limits?.max?.z ?? Number.MAX_SAFE_INTEGER)
    };
  }
  /**
   * lerp
   *
   * Constructs a new vector using linear interpolation on each component from two vectors.
   */
  static lerp(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
  }
  /**
   * slerp
   *
   * Constructs a new vector using spherical linear interpolation on each component from two vectors.
   */
  static slerp(a, b, t) {
    const theta = Math.acos(_Vector3Utils.dot(a, b));
    const sinTheta = Math.sin(theta);
    const ta = Math.sin((1 - t) * theta) / sinTheta;
    const tb = Math.sin(t * theta) / sinTheta;
    return _Vector3Utils.add(_Vector3Utils.scale(a, ta), _Vector3Utils.scale(b, tb));
  }
  /**
   * multiply
   *
   * Element-wise multiplication of two vectors together.
   * Not to be confused with {@link Vector3Utils.dot} product or {@link Vector3Utils.cross} product
   */
  static multiply(a, b) {
    return { x: a.x * b.x, y: a.y * b.y, z: a.z * b.z };
  }
  /**
   * rotateX
   *
   * Rotates the vector around the x axis counterclockwise (left hand rule)
   * @param a - Angle in radians
   */
  static rotateX(v, a) {
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    return { x: v.x, y: v.y * cos - v.z * sin, z: v.z * cos + v.y * sin };
  }
  /**
   * rotateY
   *
   * Rotates the vector around the y axis counterclockwise (left hand rule)
   * @param a - Angle in radians
   */
  static rotateY(v, a) {
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    return { x: v.x * cos + v.z * sin, y: v.y, z: v.z * cos - v.x * sin };
  }
  /**
   * rotateZ
   *
   * Rotates the vector around the z axis counterclockwise (left hand rule)
   * @param a - Angle in radians
   */
  static rotateZ(v, a) {
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    return { x: v.x * cos - v.y * sin, y: v.y * cos + v.x * sin, z: v.z };
  }
};

// packs/scripts/core/utils/PlayerManagers.ts
import { world as world4 } from "@minecraft/server";
function getAllPlayers(filter) {
  const players = world4.getAllPlayers();
  if (filter) {
    return players.filter(filter);
  }
  return players;
}

// packs/scripts/kisux3/plugins/ItemStacker/services/utils.ts
function* StackingItem(config) {
  try {
    const UnStackItem = config.ItemStackConfig.has("UnStackItem") ? config.ItemStackConfig.get("UnStackItem") : [];
    const CombineItemStack = (en) => {
      if (!en.isValid) return;
      const item = en.getComponent("item").itemStack;
      let totalAmount = 0;
      if (!(item.nameTag || item.typeId.includes("potion") || item.typeId.includes("shulker_box") || item.typeId.includes("bundle") || item.typeId.includes("bed") || item.typeId.includes("bottle") || [...UnStackItem].some((x) => item.typeId.includes(x)))) {
        const itemNearBy = getItemNearBy(en, config);
        for (const target of itemNearBy) {
          totalAmount += config.ItemStackData.get(target.id).amount;
          if (config.ItemStackData.has(target.id)) config.ItemStackData.delete(target.id);
          if (config.ItemListStack.has(target)) config.ItemListStack.delete(target);
          target.addTag("fakeItem");
          target.remove();
        }
      }
      config.ItemStackData.set(en.id, { amount: totalAmount + item.amount, item: ItemConvert.ItemToJson(item), life: system3.currentTick, currAmount: totalAmount, nowAmount: en.getComponent("item").itemStack.amount });
      config.ItemListStack.delete(en);
    };
    const UpdateItemStack = (enData) => {
      const en = world5.getDimension("overworld").getEntities().filter((x) => x.id == enData[0])[0];
      if (en && en.isValid) {
        const data = config.ItemStackData.get(en.id);
        const item = en.getComponent("item").itemStack;
        config.ItemStackData.set(en.id, { amount: data.currAmount + item.amount, item: data.item, life: data.life, currAmount: data.currAmount, nowAmount: en.getComponent("item").itemStack.amount });
      }
    };
    if (system3.currentTick % 2 === 0) {
      for (const en of config.ItemListStack) {
        CombineItemStack(en);
        yield;
      }
    } else {
      for (const enData of config.ItemStackData) {
        UpdateItemStack(enData);
        yield;
      }
    }
    const fastModeStacking = config.ItemStackConfig.get("FastModeStacking");
    if (fastModeStacking) {
      system3.run(() => FastModeStacking(config));
    } else {
      system3.run(() => system3.runJob(StackingItem(config)));
    }
  } catch (_e) {
    system3.run(() => {
      StackingItem(config);
    });
  }
}
function FastModeStacking(config) {
  try {
    const UnStackItem = config.ItemStackConfig.has("UnStackItem") ? config.ItemStackConfig.get("UnStackItem") : [];
    const CombineItemStack = (en) => {
      if (!en.isValid) return;
      const item = en.getComponent("item").itemStack;
      let totalAmount = 0;
      if (!(item.nameTag || item.typeId.includes("potion") || item.typeId.includes("shulker_box") || item.typeId.includes("bundle") || item.typeId.includes("bed") || item.typeId.includes("bottle") || [...UnStackItem].some((x) => item.typeId.includes(x)))) {
        const itemNearBy = getItemNearBy(en, config);
        for (const target of itemNearBy) {
          totalAmount += config.ItemStackData.get(target.id).amount;
          if (config.ItemStackData.has(target.id)) config.ItemStackData.delete(target.id);
          if (config.ItemListStack.has(target)) config.ItemListStack.delete(target);
          target.addTag("fakeItem");
          target.remove();
        }
      }
      config.ItemStackData.set(en.id, { amount: totalAmount + item.amount, item: ItemConvert.ItemToJson(item), life: system3.currentTick, currAmount: totalAmount, nowAmount: en.getComponent("item").itemStack.amount });
      config.ItemListStack.delete(en);
    };
    const UpdateItemStack = (enData) => {
      const en = world5.getDimension("overworld").getEntities().filter((x) => x.id == enData[0])[0];
      if (en && en.isValid) {
        const data = config.ItemStackData.get(en.id);
        const item = en.getComponent("item").itemStack;
        config.ItemStackData.set(en.id, { amount: data.currAmount + item.amount, item: data.item, life: data.life, currAmount: data.currAmount, nowAmount: en.getComponent("item").itemStack.amount });
      }
    };
    if (system3.currentTick % 2 === 0) {
      for (const en of config.ItemListStack) {
        CombineItemStack(en);
      }
    } else {
      for (const enData of config.ItemStackData) {
        UpdateItemStack(enData);
      }
    }
    const fastModeStacking = config.ItemStackConfig.get("FastModeStacking");
    if (fastModeStacking) {
      system3.run(() => FastModeStacking(config));
    } else {
      system3.runJob(StackingItem(config));
    }
  } catch (e) {
    console.warn(e);
    system3.run(() => {
      FastModeStacking(config);
    });
  }
}
function* SeeingItem(config) {
  try {
    const ListStack = [...config.ItemStackData.keys()];
    const radiusSeeing = config.ItemStackConfig.get("RadiusSeeing") || 7;
    for (const pl of world5.getAllPlayers()) {
      const allEnititys = pl.dimension.getEntities({ type: "minecraft:item" }).filter((x) => ListStack.some((d) => d == x.id));
      const filterEntitys = pl.dimension.getEntities({ maxDistance: radiusSeeing, location: pl.location, type: "minecraft:item" }).filter((x) => ListStack.some((d) => d == x.id));
      const updateItemName = (en) => {
        const itemData = config.ItemStackData.get(en.id);
        const displayText = config.ItemStackConfig.get("DisplayText") || "";
        if (itemData && en.isValid) {
          const timeData = getTimeRemaining(5, 30, itemData.life);
          let text = displayText;
          text = `\xA7e\uE10E ` + text;
          text = text.replace(/%a/g, `${getItemColorCode(itemData.amount)}x${itemData.amount}\xA7r`);
          text = text.replace(/%n/g, ItemsToName(en) ?? "Unknown Item");
          text = text.replace(/%m/g, `${Math.max(timeData.m, 0)}`);
          text = text.replace(/%s/g, `${timeData.s}`);
          text = text.replace(/%l/g, "\n");
          en.nameTag = text;
        }
      };
      const updateTime = (en, itemData) => {
        const timeData = getTimeRemaining(5, 30, itemData.life);
        if (timeData.m < 0) {
          config.ItemStackData.delete(en.id);
          en.addTag("fakeItem");
          en.remove();
        } else if (system3.currentTick % 20 == 0) {
          const playerNears = getAllPlayers((pl2) => {
            return Vector3Utils.distance(pl2.location, en.location) <= radiusSeeing && pl2.dimension === en.dimension;
          });
          if (playerNears.length == 0) en.nameTag = "";
        }
        ;
      };
      for (const en of filterEntitys) {
        updateItemName(en);
        yield;
      }
      for (const en of allEnititys) {
        const itemData = config.ItemStackData.get(en.id);
        if (itemData && en.isValid) {
          updateTime(en, itemData);
          yield;
        }
      }
      yield;
    }
    system3.runJob(SeeingItem(config));
  } catch (_e) {
    system3.run(() => {
      SeeingItem(config);
    });
  }
}
function getItemNearBy(en, config) {
  const radius = config.ItemStackConfig.get("RadiusCombine") || 15;
  const UnStackItem = config.ItemStackConfig.get("UnStackItem") || [];
  const itemStack = en.getComponent("item").itemStack;
  const allEntities = getAllEntities((x) => {
    if (x.dimension !== en.dimension) return false;
    if (x.typeId !== "minecraft:item") return false;
    if (Vector3Utils.distance(en.location, x.location) > radius) return false;
    return true;
  });
  const jsonItem = ItemConvert.ItemToJson(itemStack);
  jsonItem.amount = 0;
  return allEntities.filter((target) => {
    if (!en.isValid || !target.isValid) return false;
    if (target.id === en.id) return false;
    const jsonTarget = ItemConvert.ItemToJson(target.getComponent("item").itemStack);
    jsonTarget.amount = 0;
    if (JSON.stringify(jsonItem) !== JSON.stringify(jsonTarget)) return false;
    const targetItemStack = target.getComponent("item").itemStack;
    if ([...UnStackItem].some((x) => x == targetItemStack.typeId)) return false;
    if (targetItemStack.nameTag) return false;
    if (!config.ItemStackData.has(target.id)) return false;
    if (itemStack.getLore().join(",") !== targetItemStack.getLore().join(",")) return false;
    if (itemStack.typeId !== targetItemStack.typeId) return false;
    if (itemStack.getTags().join(",") !== targetItemStack.getTags().join(",")) return false;
    if (itemStack.hasComponent("minecraft:potion") || targetItemStack.hasComponent("minecraft:potion")) return false;
    if (itemStack.hasComponent("minecraft:book") || targetItemStack.hasComponent("minecraft:book")) return false;
    if (itemStack.hasComponent("minecraft:inventory") || targetItemStack.hasComponent("minecraft:inventory")) return false;
    if (itemStack.hasComponent("minecraft:dyeable") && targetItemStack.hasComponent("minecraft:dyeable")) {
      const itemDyeable = itemStack.getComponent("minecraft:dyeable");
      const targetDyeable = targetItemStack.getComponent("minecraft:dyeable");
      console.info(itemDyeable, targetDyeable);
    }
    if (itemStack.hasComponent(ItemEnchantableComponent2.componentId) && targetItemStack.hasComponent(ItemEnchantableComponent2.componentId)) {
      const itemEn = itemStack.getComponent(ItemEnchantableComponent2.componentId);
      const targetEn = targetItemStack.getComponent(ItemEnchantableComponent2.componentId);
      const itemEnchants = itemEn.getEnchantments();
      const targetEnchants = targetEn.getEnchantments();
      if (itemEnchants.length !== targetEnchants.length) return false;
      for (let i = 0; i < itemEnchants.length; i++) {
        if (itemEnchants[i].type.id !== targetEnchants[i].type.id || itemEnchants[i].level !== targetEnchants[i].level) {
          return false;
        }
      }
    }
    return true;
  });
}
function getTimeRemaining(minutes, seconds, referenceTick) {
  const now = system3.currentTick;
  const specifiedTimeTicks = (minutes * 60 + seconds) * 20;
  const targetTick = referenceTick + specifiedTimeTicks;
  let diffTicks = targetTick - now;
  const diffMinutes = Math.floor(diffTicks / (20 * 60));
  diffTicks -= diffMinutes * (20 * 60);
  const diffSeconds = Math.floor(diffTicks / 20);
  return { m: diffMinutes, s: diffSeconds };
}
function ItemsToName(entity) {
  return entity.getComponent("item").itemStack.nameTag ? entity.getComponent("item").itemStack.nameTag : entity.getComponent("item").itemStack.typeId.split(":")[1].split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
function getItemColorCode(amount) {
  if (amount >= 1290) return "\xA79";
  if (amount >= 960) return "\xA7b";
  if (amount >= 390) return "\xA7a";
  if (amount >= 108) return "\xA7e";
  if (amount >= 88) return "\xA7g";
  if (amount >= 68) return "\xA7p";
  if (amount >= 48) return "\xA76";
  if (amount >= 18) return "\xA7v";
  return "\xA7c";
}
function deStackItemStack(config, itemRemovedData) {
  try {
    const itemData = config.DimensionDataBackUp.has(itemRemovedData.id) ? config.DimensionDataBackUp.get(itemRemovedData.id) : config.ItemStackData.get(itemRemovedData.id);
    if (!itemData) return;
    const itemToSpawn = itemData.amount - itemData.nowAmount;
    if (itemToSpawn > 0) {
      const itemStackSpawn = ItemConvert.JsonToItem(itemData.item).clone ? ItemConvert.JsonToItem(itemData.item).clone() : new ItemStack2(itemData.item.typeId, itemData.item.amount);
      itemStackSpawn.amount = itemToSpawn <= itemStackSpawn.maxAmount ? itemToSpawn : itemStackSpawn.maxAmount;
      const itemSetData = { ...itemData };
      itemSetData.currAmount -= itemStackSpawn.amount;
      itemSetData.amount -= itemStackSpawn.amount;
      const enBase = world5.getDimension(itemRemovedData.dim).spawnItem(itemStackSpawn, { ...itemRemovedData.location, y: world5.getDimension(itemRemovedData.dim).heightRange.max });
      const itemStackData = config.ItemStackData;
      itemStackData.set(enBase.id, itemSetData);
      system3.run(() => {
        if (!enBase.isValid) return;
        enBase.teleport({ x: itemRemovedData.location.x, y: itemRemovedData.location.y, z: itemRemovedData.location.z });
      });
    }
    config.ItemStackData.delete(itemRemovedData.id);
    if (config.DimensionDataBackUp.has(itemRemovedData.id)) {
      config.DimensionDataBackUp.delete(itemRemovedData.id);
    }
  } catch (e) {
    const itemData = config.ItemStackData.get(itemRemovedData.id);
    console.warn(e.message);
    if (e.message.includes("Trying to")) {
      config.DimensionDataBackUp.set(itemRemovedData.id, itemData);
      console.info(`ItemStacker: Item ${itemRemovedData.id} is in a different dimension, saving data for later.`);
      return;
    }
    ;
    system3.run(() => {
      const itemStack = ItemConvert.JsonToItem(itemData.item);
      const sizeStack = getSizeStack(itemData.amount - itemData.currAmount, itemData.amount, itemStack.maxAmount);
      const itemStackSpawn = ItemConvert.JsonToItem(itemData.item).clone ? ItemConvert.JsonToItem(itemData.item).clone() : new ItemStack2(itemData.item.typeId, itemData.item.amount);
      sizeStack.forEach((item) => {
        itemStackSpawn.amount = item;
        const enBase = world5.getDimension(itemRemovedData.dim).spawnItem(ItemConvert.JsonToItem(itemStackSpawn), { ...itemRemovedData.location, y: itemRemovedData.location.y + 100 });
        enBase.addTag("fakeItem");
        system3.runTimeout(() => {
          if (enBase.isValid) {
            config.ItemListStack.add(enBase);
          }
        }, 40);
      });
    });
    config.ItemStackData.delete(itemRemovedData.id);
  }
}
function getSizeStack(current, amount, maxStack) {
  const remaining = amount - current;
  return [...Array(Math.floor(remaining / maxStack)).fill(maxStack), remaining % maxStack].filter(Boolean);
}

// packs/scripts/kisux3/plugins/ConfigMenu/index.ts
import { ItemStack as ItemStack3, system as system4, world as world7 } from "@minecraft/server";

// packs/scripts/kisux3/configs/Lang.ts
import { world as world6 } from "@minecraft/server";

// packs/scripts/core/class/LangguageContext.ts
var LanguageContext = class {
  static instance;
  languageData = {};
  constructor() {
    this.languageData["en"] = {};
    this.languageData["th"] = {};
  }
  setLanguage(lang, data) {
    this.languageData[lang] = data;
  }
  getTranslation(key, pl) {
    const lang = pl.getDynamicProperty("language") || "en";
    if (this.languageData[lang] && this.languageData[lang][key]) {
      return this.languageData[lang][key](pl);
    }
    return this.languageData["en"][key]?.(pl) || key;
  }
  setPlayerLanguage(pl, lang) {
    pl.setDynamicProperty("language", lang);
  }
};
var LangguageContext_default = LanguageContext;

// packs/scripts/kisux3/configs/Lang.ts
var LanguageContext2 = new LangguageContext_default();
KXEvents.on(null, "after:worldLoad", () => {
  LanguageContext2.setLanguage("en", {
    "allstacker.toggle.fast_mode_stacking": () => "\xA7cOFF\xA77/\xA7aON \xA7rFast Mode Stacking\xA7r",
    "allstacker.message.fast_mode_stacking.changed": () => "\xA7aFast Mode Stacking\xA7r changed to: %value",
    "allstacker.title.configmenu": () => "\xA78All Stackers Settings",
    "allstacker.body.configmenu": (pl) => `Hello, \xA7e${pl.name}\xA7r!

This is the configuration menu.
You can manage settings here.`,
    "allstacker.button.language": () => "\xA73Language",
    "allstacker.title.language": () => "\xA78Language Settings",
    "allstacker.body.language": () => "Select your preferred language.",
    "allstacker.message.language.set.english": () => `\xA77[All Stacker] \xA7rLanguage set to \xA7aEnglish\xA7r.`,
    "allstacker.message.language.set.thai": () => `\xA77[All Stacker] \xA7rLanguage set to \xA7a\u0E44\u0E17\u0E22\xA7r.`,
    "allstacker.button.back": () => `\xA7cBack`,
    "allstacker.label.plugin.list": () => `\xA77Plugins`,
    "allstacker.label.plugin.enabled": () => `\xA72Enabled\xA7r`,
    "allstacker.label.plugin.disabled": () => `\xA7cDisabled\xA7r`,
    // ItemStacker Main Settings
    "allstacker.title.itemstacker": () => "\xA78Item Stackers Settings",
    "allstacker.body.itemstacker": () => "Adjust the settings for item stacking.",
    "allstacker.label.itemstacker.description": () => "\xA7aCan\xA77 add, remove, view \xA7cunstacked items\xA7r.",
    "allstacker.button.stacking_settings": () => "Stacking Settings",
    "allstacker.button.advanced_settings": () => "Advanced Settings",
    "allstacker.label.advanced.description": () => "\xA7aCan\xA77 \xA72on\xA77/\xA7coff\xA7r and adjust the radius for seeing items, display text, and more.",
    // Unstacked Items
    "allstacker.title.unstacked": () => "\xA78Unstacked Items",
    "allstacker.body.unstacked": () => "Manage the items that are not stacked.",
    "allstacker.label.unstacked": () => "\xA7aCan\xA77 add, remove, view \xA7cunstacked items\xA7r.",
    "allstacker.button.add_unstacked": () => "Add Unstacked Item",
    "allstacker.button.remove_unstacked": () => "Remove Unstacked Item",
    "allstacker.button.view_unstacked": () => "View Unstacked Items",
    // Add Unstacked Item
    "allstacker.title.select_item": () => "\xA78Select Item",
    "allstacker.body.select_item": () => "Select an item in your inventory to unstack.",
    "allstacker.message.unstacked.added": () => `\xA7aAdded\xA7r %name to unstacked items.`,
    // Remove Unstacked Item
    "allstacker.title.remove_unstacked": () => "\xA78Remove Unstacked Item",
    "allstacker.body.remove_unstacked": () => "Select an item to remove from unstacked items.",
    "allstacker.message.unstacked.removed": () => `\xA7cRemoved\xA7r %name from unstacked items.`,
    // View Unstacked Items
    "allstacker.title.unstacked_items": () => "\xA78Unstacked Items",
    "allstacker.body.unstacked_items": () => "List of items that are not stacked.",
    "allstacker.label.no_unstacked_items": () => "\xA7cNo unstacked items found.",
    // Advanced Settings
    "allstacker.title.advanced_settings": () => "\xA78Advanced Settings",
    "allstacker.body.advanced_settings": () => "Save changes.",
    "allstacker.label.advanced.description_full": () => "Manage advanced settings for item stacking.",
    "allstacker.toggle.itemstack": () => "\xA7cOFF\xA77/\xA7aON \xA7rItemStack\xA7r",
    "allstacker.slider.radius_seeing": () => "\xA77Radius to seeing items\xA7r",
    "allstacker.slider.radius_combine": () => "\xA77Radius to combine items\xA7r",
    "allstacker.textfield.display_text": () => "\xA77Display Text\xA7r\n %%a\xA77 - show amount\xA7r\n %%n \xA77- show name\xA7r\n %%m \xA77- show minutes\xA7r\n %%s \xA77- show seconds\xA7r\n %%l \xA77- new line\xA7r",
    "allstacker.textfield.display_text.placeholder": () => "Customize the text displayed for stacked items.",
    // Messages
    "allstacker.message.display_text.changed": () => "\xA7aDisplay text changed to: %value",
    "allstacker.message.radius_seeing.changed": () => "\xA7aRadius to seeing items\xA7r changed to: %value",
    "allstacker.message.radius_combine.changed": () => "\xA7aRadius to combine items\xA7r changed to: %value",
    "allstacker.message.plugin.enabled": () => "\xA7aItemStacker plugin is now enabled!",
    "allstacker.message.plugin.disabled": () => "\xA7aItemStacker plugin is now disabled!",
    // MobStacker Main Settings
    "allstacker.title.mobstacker": () => "\xA78Mob Stacker Settings",
    "allstacker.body.mobstacker": () => "Configure the Mob Stacker plugin.",
    "allstacker.label.mobstacker.description": () => "\xA7aCan\xA77 add, remove, view \xA7bstacked mobs\xA7r.",
    "allstacker.button.mobstacker_settings": () => "Stacking Settings",
    "allstacker.label.mobstacker.advanced.description": () => "\xA7aCan\xA77 \xA72on\xA77/\xA7coff\xA7r and adjust the radius of stacking, display text of stacked mobs, and more.",
    // MobStacker Stacking Settings
    "allstacker.title.mob_stacking_settings": () => "\xA78Stacking Settings",
    "allstacker.body.mob_stacking_settings": () => "Configure the stacking settings for mobs.",
    "allstacker.button.add_stacked_mobs": () => "Add Stacked Mobs",
    "allstacker.button.remove_stacked_mobs": () => "Remove Stacked Mobs",
    "allstacker.button.view_stacked_mobs": () => "View Stacked Mobs",
    // Add Stacked Mobs
    "allstacker.title.add_stacked_mobs": () => "\xA78Add Stacked Mobs",
    "allstacker.body.add_stacked_mobs": () => "Select the mobs you want to stack within a radius of 10 blocks.",
    "allstacker.label.no_stackable_mobs": () => "\xA7cNo stackable mobs found in the radius.",
    "allstacker.message.mob.added": () => "\xA7aAdded %name to the stackable mobs.",
    // Remove Stacked Mobs
    "allstacker.title.remove_stacked_mobs": () => "\xA78Remove Stacked Mobs",
    "allstacker.body.remove_stacked_mobs": () => "Select the mobs you want to remove from stacking.",
    "allstacker.label.no_stacked_mobs": () => "\xA7cNo stackable mobs found.",
    "allstacker.message.mob.removed": () => "\xA7aRemoved %name from the stackable mobs.",
    // View Stacked Mobs
    "allstacker.title.view_stacked_mobs": () => "\xA78View Stacked Mobs",
    "allstacker.body.view_stacked_mobs": () => "List of currently stackable mobs.",
    // MobStacker Advanced Settings
    "allstacker.title.mob_advanced_settings": () => "\xA78Advanced Settings",
    "allstacker.body.mob_advanced_settings": () => "",
    "allstacker.label.mob_advanced.description": () => "Configure advanced settings for the Mob Stacker plugin.",
    "allstacker.toggle.mobstacker": () => "\xA7cOFF\xA77/\xA7aON\xA7f MobStacker",
    "allstacker.dropdown.mob_death_mode": () => "\xA77Mob Death Mode",
    "allstacker.slider.radius_stacking": () => "\xA77Radius to stacking near mobs",
    "allstacker.textfield.mob_display_text": () => "\xA77Display Text\n \xA7r%%a \xA77- show amount\n\xA7r %%n \xA77- show name\n \xA7r%%l \xA77- new line",
    "allstacker.textfield.mob_display_text.placeholder": () => "Enter the display text for stacked mobs",
    "allstacker.button.save_changes": () => "\xA78Save Changes",
    // MobStacker Messages
    "allstacker.message.mob_death_mode.changed": () => "\xA7aUpdated mob death mode to %value.",
    "allstacker.message.stacking_radius.changed": () => "\xA7aUpdated stacking radius to %value blocks.",
    "allstacker.message.mob_display_text.changed": () => "\xA7aUpdated display text to: %value",
    "allstacker.message.mobstacker.enabled": () => "\xA7aMob Stacker plugin is now enabled.",
    "allstacker.message.mobstacker.disabled": () => "\xA7aMob Stacker plugin is now disabled."
  });
  LanguageContext2.setLanguage("th", {
    "allstacker.toggle.fast_mode_stacking": () => "\xA7c\u0E1B\u0E34\u0E14\xA77/\xA7a\u0E40\u0E1B\u0E34\u0E14 \xA7rFast Mode Stacking\xA7r",
    "allstacker.message.fast_mode_stacking.changed": () => "\xA7aFast Mode Stacking\xA7r \u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E40\u0E1B\u0E47\u0E19: %value",
    "allstacker.title.configmenu": () => "\xA78\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
    "allstacker.body.configmenu": (pl) => `\u0E2A\u0E27\u0E31\u0E2A\u0E14\u0E35, \xA7e${pl.name}\xA7r!

\u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D\u0E40\u0E21\u0E19\u0E39\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32.
\u0E04\u0E38\u0E13\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48.`,
    "allstacker.button.language": () => "\xA73\u0E20\u0E32\u0E29\u0E32",
    "allstacker.title.language": () => "\xA78\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E20\u0E32\u0E29\u0E32",
    "allstacker.body.language": () => "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E20\u0E32\u0E29\u0E32\u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23.",
    "allstacker.message.language.set.english": () => `\xA77[All Stacker] \xA7r\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E20\u0E32\u0E29\u0E32\u0E40\u0E1B\u0E47\u0E19 \xA7aEnglish\xA7r.`,
    "allstacker.message.language.set.thai": () => `\xA77[All Stacker] \xA7r\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E20\u0E32\u0E29\u0E32\u0E40\u0E1B\u0E47\u0E19 \xA7a\u0E44\u0E17\u0E22\xA7r.`,
    "allstacker.button.back": () => `\xA7c\u0E01\u0E25\u0E31\u0E1A`,
    "allstacker.label.plugin.list": () => `\xA77\u0E1B\u0E25\u0E31\u0E4A\u0E01\u0E2D\u0E34\u0E19`,
    "allstacker.label.plugin.enabled": () => `\xA72\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\xA7r`,
    "allstacker.label.plugin.disabled": () => `\xA7c\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\xA7r`,
    // ItemStacker Main Settings
    "allstacker.title.itemstacker": () => "\xA78\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21",
    "allstacker.body.itemstacker": () => "\u0E1B\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21.",
    "allstacker.label.itemstacker.description": () => "\xA7a\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\xA77 \u0E40\u0E1E\u0E34\u0E48\u0E21, \u0E25\u0E1A, \u0E14\u0E39 \xA7c\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\xA7r.",
    "allstacker.button.stacking_settings": () => "\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21",
    "allstacker.button.advanced_settings": () => "\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07",
    "allstacker.label.advanced.description": () => "\xA7a\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\xA77 \xA72\u0E40\u0E1B\u0E34\u0E14\xA77/\xA7c\u0E1B\u0E34\u0E14\xA7r \u0E41\u0E25\u0E30\u0E1B\u0E23\u0E31\u0E1A\u0E23\u0E30\u0E22\u0E30\u0E01\u0E32\u0E23\u0E21\u0E2D\u0E07\u0E40\u0E2B\u0E47\u0E19\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21, \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E2A\u0E14\u0E07\u0E1C\u0E25 \u0E41\u0E25\u0E30\u0E2D\u0E37\u0E48\u0E19\u0E46",
    // Unstacked Items
    "allstacker.title.unstacked": () => "\xA78\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07",
    "allstacker.body.unstacked": () => "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07.",
    "allstacker.label.unstacked": () => "\xA7a\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\xA77 \u0E40\u0E1E\u0E34\u0E48\u0E21, \u0E25\u0E1A, \u0E14\u0E39 \xA7c\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07\xA7r.",
    "allstacker.button.add_unstacked": () => "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07",
    "allstacker.button.remove_unstacked": () => "\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07",
    "allstacker.button.view_unstacked": () => "\u0E14\u0E39\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07",
    // Add Unstacked Item
    "allstacker.title.select_item": () => "\xA78\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21",
    "allstacker.body.select_item": () => "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\u0E43\u0E19\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E01\u0E47\u0E1A\u0E02\u0E2D\u0E07\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E44\u0E21\u0E48\u0E43\u0E2B\u0E49\u0E16\u0E39\u0E01\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07.",
    "allstacker.message.unstacked.added": () => `\xA7a\u0E40\u0E1E\u0E34\u0E48\u0E21\xA7r %name \u0E25\u0E07\u0E43\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07.`,
    // Remove Unstacked Item
    "allstacker.title.remove_unstacked": () => "\xA78\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07",
    "allstacker.body.remove_unstacked": () => "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\u0E17\u0E35\u0E48\u0E08\u0E30\u0E25\u0E1A\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07.",
    "allstacker.message.unstacked.removed": () => `\xA7c\u0E25\u0E1A\xA7r %name \u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07.`,
    // View Unstacked Items
    "allstacker.title.unstacked_items": () => "\xA78\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07",
    "allstacker.body.unstacked_items": () => "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07.",
    "allstacker.label.no_unstacked_items": () => "\xA7c\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07.",
    // Advanced Settings
    "allstacker.title.advanced_settings": () => "\xA78\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07",
    "allstacker.body.advanced_settings": () => "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07.",
    "allstacker.label.advanced.description_full": () => "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21.",
    "allstacker.toggle.itemstack": () => "\xA7c\u0E1B\u0E34\u0E14\xA77/\xA7a\u0E40\u0E1B\u0E34\u0E14 \xA7r\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\xA7r",
    "allstacker.slider.radius_seeing": () => "\xA77\u0E23\u0E30\u0E22\u0E30\u0E01\u0E32\u0E23\u0E21\u0E2D\u0E07\u0E40\u0E2B\u0E47\u0E19\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\xA7r",
    "allstacker.slider.radius_combine": () => "\xA77\u0E23\u0E30\u0E22\u0E30\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\xA7r",
    "allstacker.textfield.display_text": () => "\xA77\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E2A\u0E14\u0E07\u0E1C\u0E25\xA7r\n %%a\xA77 - \u0E41\u0E2A\u0E14\u0E07\u0E08\u0E33\u0E19\u0E27\u0E19\xA7r\n %%n \xA77- \u0E41\u0E2A\u0E14\u0E07\u0E0A\u0E37\u0E48\u0E2D\xA7r\n %%m \xA77- \u0E41\u0E2A\u0E14\u0E07\u0E19\u0E32\u0E17\u0E35\xA7r\n %%s \xA77- \u0E41\u0E2A\u0E14\u0E07\u0E27\u0E34\u0E19\u0E32\u0E17\u0E35\xA7r\n %%l \xA77- \u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E43\u0E2B\u0E21\u0E48\xA7r",
    "allstacker.textfield.display_text.placeholder": () => "\u0E1B\u0E23\u0E31\u0E1A\u0E41\u0E15\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19.",
    // Messages
    "allstacker.message.display_text.changed": () => "\xA7a\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E2A\u0E14\u0E07\u0E1C\u0E25\u0E40\u0E1B\u0E47\u0E19: %value",
    "allstacker.message.radius_seeing.changed": () => "\xA7a\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E23\u0E30\u0E22\u0E30\u0E01\u0E32\u0E23\u0E21\u0E2D\u0E07\u0E40\u0E2B\u0E47\u0E19\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\xA7r \u0E40\u0E1B\u0E47\u0E19: %value",
    "allstacker.message.radius_combine.changed": () => "\xA7a\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E23\u0E30\u0E22\u0E30\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\xA7r \u0E40\u0E1B\u0E47\u0E19: %value",
    "allstacker.message.plugin.enabled": () => "\xA7a\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E1B\u0E25\u0E31\u0E4A\u0E01\u0E2D\u0E34\u0E19 ItemStacker \u0E41\u0E25\u0E49\u0E27!",
    "allstacker.message.plugin.disabled": () => "\xA7a\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E1B\u0E25\u0E31\u0E4A\u0E01\u0E2D\u0E34\u0E19 ItemStacker \u0E41\u0E25\u0E49\u0E27!",
    // MobStacker Main Settings
    "allstacker.title.mobstacker": () => "\xA78\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21\u0E21\u0E2D\u0E1A",
    "allstacker.body.mobstacker": () => "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E04\u0E48\u0E32\u0E1B\u0E25\u0E31\u0E4A\u0E01\u0E2D\u0E34\u0E19 Mob Stacker.",
    "allstacker.label.mobstacker.description": () => "\xA7a\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\xA77 \u0E40\u0E1E\u0E34\u0E48\u0E21, \u0E25\u0E1A, \u0E14\u0E39 \xA7b\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19\xA7r.",
    "allstacker.button.mobstacker_settings": () => "\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21",
    "allstacker.label.mobstacker.advanced.description": () => "\xA7a\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\xA77 \xA72\u0E40\u0E1B\u0E34\u0E14\xA77/\xA7c\u0E1B\u0E34\u0E14\xA7r \u0E41\u0E25\u0E30\u0E1B\u0E23\u0E31\u0E1A\u0E23\u0E30\u0E22\u0E30\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21, \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E2A\u0E14\u0E07\u0E1C\u0E25\u0E02\u0E2D\u0E07\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19 \u0E41\u0E25\u0E30\u0E2D\u0E37\u0E48\u0E19\u0E46",
    // MobStacker Stacking Settings
    "allstacker.title.mob_stacking_settings": () => "\xA78\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21",
    "allstacker.body.mob_stacking_settings": () => "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E04\u0E48\u0E32\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E21\u0E2D\u0E1A.",
    "allstacker.button.add_stacked_mobs": () => "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E44\u0E14\u0E49",
    "allstacker.button.remove_stacked_mobs": () => "\u0E25\u0E1A\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E44\u0E14\u0E49",
    "allstacker.button.view_stacked_mobs": () => "\u0E14\u0E39\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E44\u0E14\u0E49",
    // Add Stacked Mobs
    "allstacker.title.add_stacked_mobs": () => "\xA78\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E44\u0E14\u0E49",
    "allstacker.body.add_stacked_mobs": () => "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E49\u0E23\u0E27\u0E21\u0E44\u0E14\u0E49\u0E43\u0E19\u0E23\u0E30\u0E22\u0E30 10 \u0E1A\u0E25\u0E47\u0E2D\u0E01.",
    "allstacker.label.no_stackable_mobs": () => "\xA7c\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E23\u0E27\u0E21\u0E44\u0E14\u0E49\u0E43\u0E19\u0E23\u0E30\u0E22\u0E30\u0E19\u0E35\u0E49.",
    "allstacker.message.mob.added": () => "\xA7a\u0E40\u0E1E\u0E34\u0E48\u0E21 %name \u0E25\u0E07\u0E43\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E44\u0E14\u0E49.",
    // Remove Stacked Mobs
    "allstacker.title.remove_stacked_mobs": () => "\xA78\u0E25\u0E1A\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E44\u0E14\u0E49",
    "allstacker.body.remove_stacked_mobs": () => "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21.",
    "allstacker.label.no_stacked_mobs": () => "\xA7c\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E44\u0E14\u0E49.",
    "allstacker.message.mob.removed": () => "\xA7a\u0E25\u0E1A %name \u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E44\u0E14\u0E49.",
    // View Stacked Mobs
    "allstacker.title.view_stacked_mobs": () => "\xA78\u0E14\u0E39\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E44\u0E14\u0E49",
    "allstacker.body.view_stacked_mobs": () => "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E23\u0E27\u0E21\u0E44\u0E14\u0E49\u0E43\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19.",
    // MobStacker Advanced Settings
    "allstacker.title.mob_advanced_settings": () => "\xA78\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07",
    "allstacker.body.mob_advanced_settings": () => "",
    "allstacker.label.mob_advanced.description": () => "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E04\u0E48\u0E32\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1B\u0E25\u0E31\u0E4A\u0E01\u0E2D\u0E34\u0E19 Mob Stacker.",
    "allstacker.toggle.mobstacker": () => "\xA7c\u0E1B\u0E34\u0E14\xA77/\xA7a\u0E40\u0E1B\u0E34\u0E14\xA7f MobStacker",
    "allstacker.dropdown.mob_death_mode": () => "\xA77\u0E42\u0E2B\u0E21\u0E14\u0E01\u0E32\u0E23\u0E15\u0E32\u0E22\u0E02\u0E2D\u0E07\u0E21\u0E2D\u0E1A",
    "allstacker.slider.radius_stacking": () => "\xA77\u0E23\u0E30\u0E22\u0E30\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21\u0E21\u0E2D\u0E1A\u0E43\u0E01\u0E25\u0E49\u0E40\u0E04\u0E35\u0E22\u0E07",
    "allstacker.textfield.mob_display_text": () => "\xA77\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E2A\u0E14\u0E07\u0E1C\u0E25\n \xA7r%%a \xA77- \u0E41\u0E2A\u0E14\u0E07\u0E08\u0E33\u0E19\u0E27\u0E19\n\xA7r %%n \xA77- \u0E41\u0E2A\u0E14\u0E07\u0E0A\u0E37\u0E48\u0E2D\n \xA7r%%l \xA77- \u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E43\u0E2B\u0E21\u0E48",
    "allstacker.textfield.mob_display_text.placeholder": () => "\u0E43\u0E2A\u0E48\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E2A\u0E14\u0E07\u0E1C\u0E25\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E21\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19",
    "allstacker.button.save_changes": () => "\xA78\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07",
    // MobStacker Messages
    "allstacker.message.mob_death_mode.changed": () => "\xA7a\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E42\u0E2B\u0E21\u0E14\u0E01\u0E32\u0E23\u0E15\u0E32\u0E22\u0E02\u0E2D\u0E07\u0E21\u0E2D\u0E1A\u0E40\u0E1B\u0E47\u0E19 %value.",
    "allstacker.message.stacking_radius.changed": () => "\xA7a\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E23\u0E30\u0E22\u0E30\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21\u0E40\u0E1B\u0E47\u0E19 %value \u0E1A\u0E25\u0E47\u0E2D\u0E01.",
    "allstacker.message.mob_display_text.changed": () => "\xA7a\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E2A\u0E14\u0E07\u0E1C\u0E25\u0E40\u0E1B\u0E47\u0E19: %value",
    "allstacker.message.mobstacker.enabled": () => "\xA7a\u0E1B\u0E25\u0E31\u0E4A\u0E01\u0E2D\u0E34\u0E19 Mob Stacker \u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27.",
    "allstacker.message.mobstacker.disabled": () => "\xA7a\u0E1B\u0E25\u0E31\u0E4A\u0E01\u0E2D\u0E34\u0E19 Mob Stacker \u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27."
  });
  world6.getPlayers().forEach((pl) => {
    if (!pl.getDynamicProperty("language")) {
      LanguageContext2.setPlayerLanguage(pl, "en");
    }
  });
});

// packs/scripts/kisux3/plugins/ConfigMenu/index.ts
var ConfigMenu = class extends PluginBase {
  config = {};
  static setEnabled(pluginName, enabled) {
    const plugin = PluginLoader.find((p) => p.name === pluginName);
    if (plugin) {
      plugin.setting.enabled = enabled;
      const configLoadder = PluginLoader.find((p) => p.setting.config?.Loadder);
      if (!configLoadder) {
        console.warn(`ConfigMenu: Loadder plugin not found for ${pluginName}`);
        return;
      }
      const config = configLoadder.main.getConfig();
      if (config && config.PluginEnabled) {
        config.PluginEnabled.set(pluginName, enabled);
        const isLoadded = PluginLoader.find((p) => p.name === pluginName).setting.config.isLoadded;
        if (!isLoadded) {
          PluginLoader.find((p) => p.name === pluginName).setting.config.isLoadded = true;
          PluginLoader.find((p) => p.name === pluginName).main.onLoad();
        }
      }
    }
  }
  showConfig(pl) {
    const pluginSettingList = PluginLoader.filter((plugin) => plugin.name !== this.name);
    const configPage = new PageBuilder("configMenu");
    const pluginListPage = new IActionForm_default(`${LanguageContext2.getTranslation("allstacker.title.configmenu", pl)}`, `${LanguageContext2.getTranslation("allstacker.body.configmenu", pl)}`);
    pluginListPage.addButton(`${LanguageContext2.getTranslation("allstacker.button.language", pl)}`, "textures/ui/world_glyph_color_2x_black_outline", () => {
      const langPage = new IActionForm_default(`${LanguageContext2.getTranslation("allstacker.title.language", pl)}`, `${LanguageContext2.getTranslation("allstacker.body.language", pl)}`);
      langPage.addDivider();
      langPage.addButton("\xA7cEnglish \xA78[ENG]\xA7r", "textures/kisux3/ENG_Lang", () => {
        world7.sendMessage(LanguageContext2.getTranslation("allstacker.message.language.set.english", pl));
        LanguageContext2.setPlayerLanguage(pl, "en");
      });
      langPage.addButton("\xA72\u0E44\u0E17\u0E22 \xA78[TH]\xA7r", "textures/kisux3/TH_Lang", () => {
        world7.sendMessage(LanguageContext2.getTranslation("allstacker.message.language.set.thai", pl));
        LanguageContext2.setPlayerLanguage(pl, "th");
      });
      langPage.addDivider();
      langPage.addButton(`${LanguageContext2.getTranslation("allstacker.button.back", pl)}`, "", () => {
        configPage.showPage(pl, "plugin-settings");
      });
      configPage.addPage("language-settings", langPage);
      configPage.showPage(pl, "language-settings");
    });
    pluginListPage.addDivider();
    pluginListPage.addLabel(`${LanguageContext2.getTranslation("allstacker.label.plugin.list", pl)} \xA77(\xA7c${pluginSettingList.length}\xA77)\xA7r`);
    pluginSettingList.forEach((plugin) => {
      const isHasConfig = plugin.main.addConfig(pl, configPage, false);
      if (isHasConfig) {
        const pluginIcon = plugin.setting.config?.PluginIcon || "textures/ui/icon_book_writable";
        pluginListPage.addButton(plugin.name + `
[${plugin.setting.enabled ? `${LanguageContext2.getTranslation("allstacker.label.plugin.enabled", pl)}` : `${LanguageContext2.getTranslation("allstacker.label.plugin.disabled", pl)}`}]`, pluginIcon, () => {
          plugin.main.addConfig(pl, configPage, true);
          configPage.showPage(pl, plugin.name);
        });
      }
    });
    configPage.addPage("plugin-settings", pluginListPage);
    configPage.showPage(pl, "plugin-settings");
    return true;
  }
  onLoad(_ev) {
    this.config = this.getConfig();
    this.config.PluginEnabled = new JsonDatabase("PluginEnabled", world7);
    const pluginText = [];
    PluginLoader.forEach((plugin) => {
      const pluginName = plugin.name;
      if (!this.config.PluginEnabled.has(pluginName)) {
        this.config.PluginEnabled.set(pluginName, true);
        plugin.setting.enabled = true;
      } else {
        const isEnabled = this.config.PluginEnabled.get(pluginName);
        this.config.PluginEnabled.set(pluginName, isEnabled);
        plugin.setting.enabled = isEnabled;
      }
      pluginText.push(`${pluginName}: ${plugin.setting.enabled ? "\xA7aEnabled" : "\xA7cDisabled"}`);
    });
    const i = system4.runInterval(() => {
      const players = world7.getPlayers();
      if (players.length > 0) {
        system4.clearRun(i);
        pluginText.forEach((text) => {
          world7.sendMessage(`\xA77[All Stacker] \xA7r${text}`);
        });
      }
    });
    this.config.LoadedConfig = true;
  }
  onStartup(ev) {
    KXEvents.on(this, "after:playerSpawn", (ev2) => {
      if (!ev2.initialSpawn) return;
      const isFirstJoin = !ev2.player.getTags().includes("kisu:joined_before");
      if (isFirstJoin) {
        ev2.player.addTag("kisu:joined_before");
        this.giveConfigMenu(ev2.player);
      }
    });
    const showConfig = this.showConfig.bind(this);
    ev.itemComponentRegistry.registerCustomComponent("kisu:show_config", {
      onUse(ev2) {
        showConfig(ev2.source);
      }
    });
  }
  giveConfigMenu(pl) {
    const containers = pl.getComponent("inventory");
    const configMenuItem = new ItemStack3("kisu:ac_setting", 1);
    if (containers.container.emptySlotsCount > 0) {
      containers.container.addItem(configMenuItem);
    } else {
      pl.dimension.spawnItem(configMenuItem, pl.location);
    }
  }
};
var ConfigMenu_default = ConfigMenu;

// packs/scripts/kisux3/plugins/ItemStacker/index.ts
var itemName = (item) => {
  return (item.split(":")[1] ? item.split(":")[1] : item).split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};
var ItemStacker = class extends PluginBase {
  config = {};
  addConfig(pl, page, showUI = true) {
    if (!showUI) return true;
    const optionsConfig = {
      "Stacking Settings": () => {
        const unStackPage = new IActionForm_default(LanguageContext2.getTranslation("allstacker.title.unstacked", pl), LanguageContext2.getTranslation("allstacker.body.unstacked", pl));
        unStackPage.addDivider();
        unStackPage.addLabel(LanguageContext2.getTranslation("allstacker.label.unstacked", pl));
        unStackPage.addButton(LanguageContext2.getTranslation("allstacker.button.add_unstacked", pl), "textures/ui/icon_book_writable", () => {
          const inventory = pl.getComponent("inventory").container;
          const itemList = {};
          for (let i = 0; i < inventory.size; i++) {
            const item = inventory.getItem(i);
            if (item) {
              itemList[itemName(item.typeId)] = item;
            }
          }
          const itemSelectForm = new IActionForm_default(LanguageContext2.getTranslation("allstacker.title.select_item", pl), LanguageContext2.getTranslation("allstacker.body.select_item", pl));
          itemSelectForm.addDivider();
          Object.entries(itemList).forEach(([name, item]) => {
            if (!item || !item.typeId) return;
            if (this.config.ItemStackConfig.get("UnStackItem")?.includes(item.typeId)) return;
            itemSelectForm.addButton(name, "", () => {
              const unStackItems = this.config.ItemStackConfig.get("UnStackItem") || [];
              this.config.ItemStackConfig.set("UnStackItem", [...unStackItems, item.typeId]);
              pl.sendMessage(LanguageContext2.getTranslation("allstacker.message.unstacked.added", pl).replace("%name", name));
              page.showPage(pl, this.name + "_unstacked");
            });
          });
          itemSelectForm.addDivider();
          itemSelectForm.addButton(LanguageContext2.getTranslation("allstacker.button.back", pl), "", () => {
            page.showPage(pl, this.name + "_unstacked");
          });
          page.addPage(this.name + "_unstacked_select", itemSelectForm);
          page.showPage(pl, this.name + "_unstacked_select");
        });
        unStackPage.addButton(LanguageContext2.getTranslation("allstacker.button.remove_unstacked", pl), "textures/ui/icon_book_writable", () => {
          const unStackItems = this.config.ItemStackConfig.get("UnStackItem") || [];
          const removeItemForm = new IActionForm_default(LanguageContext2.getTranslation("allstacker.title.remove_unstacked", pl), LanguageContext2.getTranslation("allstacker.body.remove_unstacked", pl));
          removeItemForm.addDivider();
          unStackItems.forEach((itemId) => {
            removeItemForm.addButton(itemName(itemId), "", () => {
              this.config.ItemStackConfig.set("UnStackItem", unStackItems.filter((id) => id !== itemId));
              pl.sendMessage(LanguageContext2.getTranslation("allstacker.message.unstacked.removed", pl).replace("%name", itemName(itemId)));
              page.showPage(pl, this.name + "_unstacked");
            });
          });
          removeItemForm.addButton(LanguageContext2.getTranslation("allstacker.button.back", pl), "", () => {
            page.showPage(pl, this.name + "_unstacked");
          });
          page.addPage(this.name + "_unstacked_remove", removeItemForm);
          page.showPage(pl, this.name + "_unstacked_remove");
        });
        unStackPage.addButton(LanguageContext2.getTranslation("allstacker.button.view_unstacked", pl), "textures/ui/icon_book_writable", () => {
          const unStackItems = this.config.ItemStackConfig.get("UnStackItem") || [];
          const viewItemsForm = new IActionForm_default(LanguageContext2.getTranslation("allstacker.title.unstacked_items", pl), LanguageContext2.getTranslation("allstacker.body.unstacked_items", pl));
          viewItemsForm.addDivider();
          if (unStackItems.length === 0) {
            viewItemsForm.addLabel(LanguageContext2.getTranslation("allstacker.label.no_unstacked_items", pl));
          } else {
            unStackItems.forEach((itemId) => {
              viewItemsForm.addButton(itemName(itemId), "", () => {
                page.showPage(pl, this.name + "_unstacked");
              });
            });
          }
          viewItemsForm.addButton(LanguageContext2.getTranslation("allstacker.button.back", pl), "", () => {
            page.showPage(pl, this.name + "_unstacked");
          });
          page.addPage(this.name + "_unstacked_view", viewItemsForm);
          page.showPage(pl, this.name + "_unstacked_view");
        });
        unStackPage.addDivider();
        unStackPage.addButton(LanguageContext2.getTranslation("allstacker.button.back", pl), "", () => {
          page.showPage(pl, this.name);
        });
        page.addPage(this.name + "_unstacked", unStackPage);
        page.showPage(pl, this.name + "_unstacked");
      },
      "Advanced Settings": () => {
        const advandSetting = new IModalForm_default(LanguageContext2.getTranslation("allstacker.title.advanced_settings", pl), LanguageContext2.getTranslation("allstacker.body.advanced_settings", pl));
        const isEnable = PluginLoader.find((plugin) => plugin.name === this.name)?.setting.enabled || false;
        const RadiusSeeing = this.config.ItemStackConfig.get("RadiusSeeing") || 10;
        const RadiusCombine = this.config.ItemStackConfig.get("RadiusCombine") || 15;
        const DisplayText = this.config.ItemStackConfig.get("DisplayText") || "\xA77\xA7c\xA7l%a \xA7r%n\xA7r";
        const FastModeStacking2 = this.config.ItemStackConfig.get("FastModeStacking") || false;
        advandSetting.addLabel(LanguageContext2.getTranslation("allstacker.label.advanced.description_full", pl));
        advandSetting.addDivider();
        advandSetting.addToggle(LanguageContext2.getTranslation("allstacker.toggle.itemstack", pl), isEnable);
        advandSetting.addSlider(LanguageContext2.getTranslation("allstacker.slider.radius_seeing", pl), 1, 50, 1, RadiusSeeing);
        advandSetting.addSlider(LanguageContext2.getTranslation("allstacker.slider.radius_combine", pl), 1, 50, 1, RadiusCombine);
        advandSetting.addToggle(LanguageContext2.getTranslation("allstacker.toggle.fast_mode_stacking", pl), FastModeStacking2);
        advandSetting.addTextField(LanguageContext2.getTranslation("allstacker.textfield.display_text", pl), LanguageContext2.getTranslation("allstacker.textfield.display_text.placeholder", pl), DisplayText);
        advandSetting.addCallback((values, canceled) => {
          if (canceled) return;
          const isEnable2 = values[2];
          const radiusSeeing = values[3];
          const radiusCombine = values[4];
          const displayText = values[6];
          const fastModeStacking = values[5];
          const oldEnable = PluginLoader.find((plugin) => plugin.name === this.name)?.setting.enabled || false;
          const oldRadiusSeeing = this.config.ItemStackConfig.get("RadiusSeeing") || 10;
          const oldDisplayText = this.config.ItemStackConfig.get("DisplayText") || "\xA77\xA7c\xA7l%a \xA7r%n\xA7r";
          const oldRadiusCombine = this.config.ItemStackConfig.get("RadiusCombine") || 15;
          const oldFastModeStacking = this.config.ItemStackConfig.get("FastModeStacking") || false;
          this.config.ItemStackConfig.set("RadiusSeeing", radiusSeeing);
          this.config.ItemStackConfig.set("DisplayText", displayText);
          this.config.ItemStackConfig.set("RadiusCombine", radiusCombine);
          this.config.ItemStackConfig.set("FastModeStacking", fastModeStacking);
          if (oldDisplayText !== displayText && displayText !== void 0) {
            pl.sendMessage(LanguageContext2.getTranslation("allstacker.message.display_text.changed", pl).replace("%value", displayText));
          }
          if (oldRadiusSeeing !== radiusSeeing && radiusSeeing !== void 0) {
            pl.sendMessage(LanguageContext2.getTranslation("allstacker.message.radius_seeing.changed", pl).replace("%value", radiusSeeing.toString()));
          }
          if (oldRadiusCombine !== radiusCombine && radiusCombine !== void 0) {
            pl.sendMessage(LanguageContext2.getTranslation("allstacker.message.radius_combine.changed", pl).replace("%value", radiusCombine.toString()));
          }
          if (oldEnable !== isEnable2 && isEnable2 !== void 0) {
            PluginLoader.find((plugin) => plugin.name === this.name).setting.enabled = isEnable2;
            ConfigMenu_default.setEnabled(this.name, isEnable2);
            const message = isEnable2 ? LanguageContext2.getTranslation("allstacker.message.plugin.enabled", pl) : LanguageContext2.getTranslation("allstacker.message.plugin.disabled", pl);
            pl.sendMessage(message);
          }
          if (fastModeStacking !== oldFastModeStacking && fastModeStacking !== void 0) {
            this.config.ItemStackConfig.set("FastModeStacking", fastModeStacking);
            pl.sendMessage(LanguageContext2.getTranslation("allstacker.message.fast_mode_stacking.changed", pl).replace("%value", fastModeStacking.toString()));
          }
        });
        page.addPage(this.name + "_advanced_settings", advandSetting);
        page.showPage(pl, this.name + "_advanced_settings");
      }
    };
    const configUi = new IActionForm_default(LanguageContext2.getTranslation("allstacker.title.itemstacker", pl), LanguageContext2.getTranslation("allstacker.body.itemstacker", pl));
    configUi.addDivider();
    configUi.addLabel(LanguageContext2.getTranslation("allstacker.label.itemstacker.description", pl));
    configUi.addButton(LanguageContext2.getTranslation("allstacker.button.stacking_settings", pl), "textures/blocks/barrier", () => {
      optionsConfig["Stacking Settings"]();
    });
    configUi.addLabel(LanguageContext2.getTranslation("allstacker.label.advanced.description", pl));
    configUi.addButton(LanguageContext2.getTranslation("allstacker.button.advanced_settings", pl), "textures/ui/settings_glyph_color_2x", () => {
      optionsConfig["Advanced Settings"]();
    });
    configUi.addDivider();
    configUi.addButton(LanguageContext2.getTranslation("allstacker.button.back", pl), "", () => {
      page.showPage(pl, "plugin-settings");
    });
    page.addPage(this.name, configUi);
    return true;
  }
  onItemSpawned(ev) {
    const isNewItems = (item) => {
      return ev.entity.isValid && item.typeId === "minecraft:item" && !this.config.ItemStackData.has(ev.entity.id) && !ev.entity.hasTag("fakeItem");
    };
    if (isNewItems(ev.entity)) {
      this.config.ItemListStack.add(ev.entity);
    }
  }
  onItemRemoved(ev) {
    if (ev.removedEntity.typeId !== "minecraft:item" || ev.removedEntity.hasTag("fakeItem") || this.config.ItemListStack.has(ev.removedEntity)) return;
    const itemRemovedData = {
      location: ev.removedEntity.location,
      id: ev.removedEntity.id,
      dim: ev.removedEntity.dimension.id
    };
    system5.run(() => deStackItemStack(this.config, itemRemovedData));
  }
  runJobs() {
    const fastModeStacking = this.config.ItemStackConfig.get("FastModeStacking");
    if (fastModeStacking) {
      system5.run(() => FastModeStacking(this.config));
    } else {
      system5.runJob(StackingItem(this.config));
    }
    system5.runJob(SeeingItem(this.config));
  }
  onLoad(_ev) {
    this.initializeConfig();
    this.runJobs();
    KXEvents.on(this, "after:entitySpawn", (ev) => {
      this.onItemSpawned(ev);
    });
    KXEvents.on(this, "before:entityRemove", (ev) => {
      this.onItemRemoved(ev);
    });
    this.config.isLoaded = true;
  }
  initializeConfig() {
    this.config = this.getConfig();
    this.config.ItemStackConfig = new JsonDatabase("ItemStackConfig", world8);
    this.config.ItemStackData = new JsonDatabase("ItemStackData", world8);
    this.config.DimensionDataBackUp = new JsonDatabase("DimensionDataBackUp", world8);
    const UnStackItem = this.config.ItemStackConfig.get("UnStackItem") || [];
    const DisplayText = this.config.ItemStackConfig.get("DisplayText") || "\xA77\xA7c\xA7l%a \xA7r%n\xA7r";
    const RadiusSeeing = this.config.ItemStackConfig.get("RadiusSeeing") || 10;
    const RadiusCombine = this.config.ItemStackConfig.get("RadiusCombine") || 15;
    this.config.ItemStackConfig.set("UnStackItem", UnStackItem);
    this.config.ItemStackConfig.set("DisplayText", DisplayText);
    this.config.ItemStackConfig.set("RadiusSeeing", RadiusSeeing);
    this.config.ItemStackConfig.set("RadiusCombine", RadiusCombine);
  }
};
var ItemStacker_default = ItemStacker;

// packs/scripts/kisux3/plugins/MobStacker/index.ts
import { EntityDamageCause, EntityEquippableComponent, EntityProjectileComponent, EquipmentSlot, system as system7, world as world9 } from "@minecraft/server";

// packs/scripts/kisux3/plugins/MobStacker/services/utils.ts
import { EntityIsBabyComponent, EntityLeashableComponent, EntityScaleComponent, system as system6 } from "@minecraft/server";
function* StackingMob(config) {
  new Promise(async (resolve) => {
    try {
      const allEntities = getAllEntities((en) => {
        if (!config.ResetEntities.has(en) && [...config.MobStackConfig.get("StackMob") || []].some((b) => b === en.typeId) && en.location) return true;
        return false;
      });
      for (const entity of allEntities) {
        let removedAmount = 0;
        if (!entity.isValid) continue;
        const nearEntities = getEntitiesNearBy(entity.dimension, entity, config);
        if (!nearEntities || nearEntities.length === 0) {
          continue;
        }
        for (const target of nearEntities) {
          const amount = target.getDynamicProperty("StackingAmount") || 1;
          const entityAmount = entity.getDynamicProperty("StackingAmount") || 1;
          if (amount > entityAmount) continue;
          target.dimension.spawnParticle("minecraft:large_explosion", { ...target.location, y: target.location.y + 0.5 });
          target.remove();
          removedAmount += amount;
        }
        const currAmount = entity.getDynamicProperty("StackingAmount") || 1;
        const displayText = config.MobStackConfig.get("DisplayText") || "\xA77\xA7c\xA7l%a \xA7r%n\xA7r";
        entity.setDynamicProperty("StackingAmount", removedAmount + currAmount);
        let text = displayText;
        text = `\xA7e\uE10E ` + text;
        text = text.replace(/%a/g, `${getMobColorCode(removedAmount + currAmount)}x${removedAmount + currAmount}\xA7r`);
        text = text.replace(/%n/g, EntityToName(entity));
        text = text.replace(/%l/g, "\n");
        entity.nameTag = text;
      }
      await system6.waitTicks(20);
      resolve();
    } catch (_error) {
      system6.runTimeout(() => {
        StackingMob(config);
      }, 20);
    }
  }).finally(() => {
    system6.runJob(StackingMob(config));
  });
}
function EntityToName(en) {
  return en.typeId.split(":")[1].split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
function getEntitiesNearBy(dimension, en, config) {
  const radiusStacking = config.MobStackConfig.get("RadiusStacking") || 10;
  const allEn = dimension.getEntities({ location: en.location, maxDistance: radiusStacking, type: en.typeId }).filter((x) => x.id !== en.id).filter((x) => !config.ResetEntities.has(x)).filter((x) => x.hasComponent("is_baby") == en.hasComponent("is_baby")).filter((x) => !x.hasComponent("is_tamed")).filter((x) => {
    if (x.hasComponent(EntityLeashableComponent.componentId)) {
      const leashable = x.getComponent(EntityLeashableComponent.componentId);
      if (leashable && leashable.leashHolder) return false;
    }
    return true;
  }).filter((x) => x.getComponent("color")?.value == en.getComponent("color")?.value).filter((x) => {
    const isHasStackEn = x.getDynamicProperty("StackingAmount");
    const isHasStackTarget = en.getDynamicProperty("StackingAmount");
    if (isHasStackEn && isHasStackTarget) return true;
    if (!(isHasStackEn && isHasStackTarget)) return true;
    return false;
  }).filter((x) => {
    if (!x.hasComponent(EntityScaleComponent.componentId)) return true;
    if (x.getComponent(EntityScaleComponent.componentId).value !== en.getComponent(EntityScaleComponent.componentId).value) return false;
  });
  return allEn;
}
function getMobColorCode(amount) {
  if (amount >= 1290) return "\xA79";
  if (amount >= 960) return "\xA7b";
  if (amount >= 390) return "\xA7a";
  if (amount >= 108) return "\xA7e";
  if (amount >= 88) return "\xA7g";
  if (amount >= 68) return "\xA7p";
  if (amount >= 48) return "\xA76";
  if (amount >= 18) return "\xA7v";
  return "\xA7c";
}
function spawnEntityClone(en) {
  const entityNew = en.dimension.spawnEntity(en.typeId, en.location);
  if (entityNew.hasComponent("color")) {
    entityNew.getComponent("color").value = en.getComponent("color").value;
  }
  if (en.hasComponent(EntityIsBabyComponent.componentId)) {
    try {
      entityNew.triggerEvent("minecraft:entity_born");
    } catch (_e) {
    }
  } else {
    try {
      entityNew.triggerEvent("minecraft:ageable_grow_up");
    } catch (_e) {
    }
  }
  return entityNew;
}

// packs/scripts/kisux3/plugins/MobStacker/index.ts
var IdToName = (mob) => {
  return mob.split(":")[1].split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};
var MobStacker = class extends PluginBase {
  config = {};
  onLoad(_ev) {
    this.initializeConfig();
    this.runJobs();
    KXEvents.on(this, "after:entityDie", (ev) => {
      this.onEntityDie(ev);
    });
    KXEvents.on(this, "before:playerInteractWithEntity", (ev) => {
      this.onEntityInteract(ev);
    });
    KXEvents.on(this, "before:entityRemove", (ev) => {
      this.onXpDrop(ev);
    });
  }
  onXpDrop(ev) {
    const RemovedEntityData = {
      id: ev.removedEntity.id,
      location: ev.removedEntity.location,
      dimension: ev.removedEntity.dimension.id
    };
    system7.run(() => {
      if (this.config.Xp_Queue.has(RemovedEntityData.id)) {
        const xpData = this.config.Xp_Queue.get(RemovedEntityData.id) || 0;
        const xp_orb = world9.getDimension(RemovedEntityData.dimension).getEntities({
          location: RemovedEntityData.location,
          type: "minecraft:xp_orb",
          maxDistance: 1,
          excludeTags: ["kisu:mob_stacker_xp_orb"]
        });
        for (let i = 0; i < xpData; i++) {
          xp_orb.forEach((orb) => {
            if (orb.isValid) {
              const orbSpawn = world9.getDimension(RemovedEntityData.dimension).spawnEntity("minecraft:xp_orb", orb.location);
              orbSpawn.addTag("kisu:mob_stacker_xp_orb");
            }
          });
        }
      }
    });
  }
  onEntityInteract(ev) {
    const amount = ev.target.getDynamicProperty("StackingAmount");
    if (amount && amount > 1) {
      const currAmount = amount || 1;
      system7.run(() => {
        if (!ev.target.isValid) return;
        const entityNew = spawnEntityClone(ev.target);
        entityNew.setDynamicProperty("StackingAmount", currAmount - 1);
        const displayText = this.config.MobStackConfig.get("DisplayText") || "\xA77\xA7c\xA7l%a \xA7r%n\xA7r";
        if (currAmount - 1 > 1) {
          let text = displayText;
          text = `\xA7e\uE10E ` + text;
          text = text.replace(/%a/g, `${getMobColorCode(currAmount - 1)}x${currAmount - 1}\xA7r`);
          text = text.replace(/%n/g, EntityToName(entityNew));
          text = text.replace(/%l/g, "\n");
          entityNew.nameTag = text;
        }
        ev.target.setDynamicProperty("StackingAmount", 1);
        if (ev.target.nameTag.includes("\uE10E")) {
          ev.target.nameTag = "";
          this.config.ResetEntities.add(ev.target);
          system7.runTimeout(() => {
            this.config.ResetEntities.delete(ev.target);
          }, 200);
        } else {
          this.config.ResetEntities.add(ev.target);
          system7.runTimeout(() => {
            this.config.ResetEntities.delete(ev.target);
          }, 200);
        }
      });
    }
  }
  onEntityDie(ev) {
    if (!ev.deadEntity.isValid) return;
    if (ev.deadEntity.hasComponent(EntityProjectileComponent.componentId)) return;
    if (ev.damageSource.cause == EntityDamageCause.none || ev.damageSource.cause == EntityDamageCause.selfDestruct) return;
    const currAmount = ev.deadEntity.getDynamicProperty("StackingAmount") || 1;
    if (currAmount <= 1) return;
    const MobDeathMode = this.config.MobStackConfig.get("MobDeathMode") || "All";
    if (MobDeathMode === "All") {
      const spawnClone = spawnEntityClone(ev.deadEntity);
      if (currAmount > 32) {
        for (let i = 0; i < 31; i++) {
          const { x, y, z } = spawnClone.location;
          const randomTag = Array.from(
            { length: Math.floor(Math.random() * 13) + 1 },
            () => String.fromCharCode(
              Math.random() < 0.5 ? Math.floor(Math.random() * 26) + 65 : Math.floor(Math.random() * 26) + 97
              // a-z
            )
          ).join("");
          const isFireDamage = ev.damageSource.cause === EntityDamageCause.fire || ev.damageSource.cause === EntityDamageCause.fireTick || ev.damageSource.cause === EntityDamageCause.lava;
          if (!ev.damageSource.damagingEntity || !ev.damageSource.damagingEntity.isValid) {
            spawnClone.addTag(randomTag);
            if (isFireDamage) {
              spawnClone.dimension.runCommand(`loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
            } else {
              const loot = world9.getLootTableManager().generateLootFromEntity(spawnClone);
              if (!loot) return;
              loot.forEach((item) => {
                spawnClone.dimension.spawnItem(item, spawnClone.location);
              });
            }
          } else {
            const itemHeld = ev.damageSource.damagingEntity.hasComponent(EntityEquippableComponent.componentId) ? ev.damageSource.damagingEntity.getComponent(EntityEquippableComponent.componentId).getEquipment(EquipmentSlot.Mainhand) : null;
            spawnClone.addTag(randomTag);
            if (itemHeld && ev.damageSource.damagingEntity.typeId === "minecraft:player") {
              const loot = world9.getLootTableManager().generateLootFromEntity(spawnClone, itemHeld);
              if (!loot) return;
              loot.forEach((item) => {
                ev.damageSource.damagingEntity.dimension.spawnItem(item, spawnClone.location);
              });
            } else if (ev.damageSource.cause === EntityDamageCause.projectile && ["minecraft:skeleton", "minecraft:stray", "minecraft:bogged"].includes(ev.damageSource.damagingEntity.typeId)) {
              ev.damageSource.damagingEntity.addTag(randomTag + "_projectile");
              ev.damageSource.damagingEntity.runCommand(`execute as @e[tag=${randomTag}_projectile] at @s run loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
            } else if (ev.damageSource.damagingEntity) {
              const damagingEntity = ev.damageSource.damagingEntity;
              damagingEntity.addTag(randomTag + "_entity");
              damagingEntity.dimension.runCommand(`execute as @e[tag=${randomTag}_entity] at @s run loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}] mainhand`);
            } else {
              if (isFireDamage) {
                spawnClone.dimension.runCommand(`loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
              } else {
                const loot = world9.getLootTableManager().generateLootFromEntity(spawnClone);
                if (!loot) return;
                loot.forEach((item) => {
                  spawnClone.dimension.spawnItem(item, spawnClone.location);
                });
              }
            }
          }
        }
        spawnClone.remove();
        const entityNew = spawnEntityClone(ev.deadEntity);
        entityNew.setDynamicProperty("StackingAmount", currAmount - 32);
        const displayText = this.config.MobStackConfig.get("DisplayText") || "\xA77\xA7c\xA7l%a \xA7r%n\xA7r";
        let text = displayText;
        text = `\xA7e\uE10E ` + text;
        text = text.replace(/%a/g, `${getMobColorCode(currAmount - 32)}x${currAmount - 32}\xA7r`);
        text = text.replace(/%n/g, EntityToName(entityNew));
        text = text.replace(/%l/g, "\n");
        entityNew.nameTag = text;
        this.config.Xp_Queue.set(ev.deadEntity.id, 31);
      } else {
        const isFireDamage = ev.damageSource.cause === EntityDamageCause.fire || ev.damageSource.cause === EntityDamageCause.fireTick || ev.damageSource.cause === EntityDamageCause.lava;
        for (let i = 0; i < currAmount - 1; i++) {
          const { x, y, z } = spawnClone.location;
          const randomTag = Array.from(
            { length: Math.floor(Math.random() * 13) + 1 },
            () => String.fromCharCode(
              Math.random() < 0.5 ? Math.floor(Math.random() * 26) + 65 : Math.floor(Math.random() * 26) + 97
              // a-z
            )
          ).join("");
          if (!ev.damageSource.damagingEntity || !ev.damageSource.damagingEntity.isValid) {
            spawnClone.addTag(randomTag);
            if (isFireDamage) {
              spawnClone.dimension.runCommand(`loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
            } else {
              const loot = world9.getLootTableManager().generateLootFromEntity(spawnClone);
              if (!loot) return;
              loot.forEach((item) => {
                spawnClone.dimension.spawnItem(item, spawnClone.location);
              });
            }
          } else {
            const itemHeld = ev.damageSource.damagingEntity.hasComponent(EntityEquippableComponent.componentId) ? ev.damageSource.damagingEntity.getComponent(EntityEquippableComponent.componentId).getEquipment(EquipmentSlot.Mainhand) : null;
            spawnClone.addTag(randomTag);
            if (itemHeld && ev.damageSource.damagingEntity.typeId === "minecraft:player") {
              ev.damageSource.damagingEntity.dimension.runCommand(`execute as ${ev.damageSource.damagingEntity.name} at @s run loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}] mainhand`);
            } else if (ev.damageSource.cause === EntityDamageCause.projectile && ["minecraft:skeleton", "minecraft:stray", "minecraft:bogged"].includes(ev.damageSource.damagingEntity.typeId)) {
              ev.damageSource.damagingEntity.addTag(randomTag + "_projectile");
              ev.damageSource.damagingEntity.runCommand(`execute as @e[tag=${randomTag}_projectile] at @s run loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
            } else if (ev.damageSource.damagingEntity) {
              const damagingEntity = ev.damageSource.damagingEntity;
              damagingEntity.addTag(randomTag + "_entity");
              damagingEntity.dimension.runCommand(`execute as @e[tag=${randomTag}_entity] at @s run loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
            } else {
              if (isFireDamage) {
                spawnClone.dimension.runCommand(`loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
              } else {
                const loot = world9.getLootTableManager().generateLootFromEntity(spawnClone);
                if (!loot) return;
                loot.forEach((item) => {
                  spawnClone.dimension.spawnItem(item, spawnClone.location);
                });
              }
            }
          }
        }
        spawnClone.remove();
        this.config.Xp_Queue.set(ev.deadEntity.id, currAmount - 1);
      }
    } else if (ev.deadEntity.getDynamicProperty("StackingAmount")) {
      if (currAmount - 1 <= 0) {
        return;
      } else {
        const entityNew = spawnEntityClone(ev.deadEntity);
        if (currAmount - 1 <= 1) return;
        entityNew.setDynamicProperty("StackingAmount", currAmount - 1);
        const displayText = this.config.MobStackConfig.get("DisplayText") || "\xA77\xA7c\xA7l%a \xA7r%n\xA7r";
        let text = displayText;
        text = `\xA7e\uE10E ` + text;
        text = text.replace(/%a/g, `${getMobColorCode(currAmount - 1)}x${currAmount - 1}\xA7r`);
        text = text.replace(/%n/g, EntityToName(entityNew));
        text = text.replace(/%l/g, "\n");
        entityNew.nameTag = text;
      }
    }
  }
  runJobs() {
    system7.runJob(StackingMob(this.config));
  }
  addConfig(pl, page, showUI = true) {
    if (!showUI) return true;
    const configUI = new IActionForm_default(LanguageContext2.getTranslation("allstacker.title.mobstacker", pl), LanguageContext2.getTranslation("allstacker.body.mobstacker", pl));
    configUI.addDivider();
    configUI.addLabel(LanguageContext2.getTranslation("allstacker.label.mobstacker.description", pl));
    configUI.addButton(LanguageContext2.getTranslation("allstacker.button.mobstacker_settings", pl), "textures/blocks/build_allow", () => {
      const stackedUI = new IActionForm_default(LanguageContext2.getTranslation("allstacker.title.mob_stacking_settings", pl), LanguageContext2.getTranslation("allstacker.body.mob_stacking_settings", pl));
      stackedUI.addDivider();
      stackedUI.addLabel(LanguageContext2.getTranslation("allstacker.label.mobstacker.advanced.description", pl));
      stackedUI.addButton(LanguageContext2.getTranslation("allstacker.button.add_stacked_mobs", pl), "textures/ui/icon_book_writable", () => {
        const addStackedUI = new IActionForm_default(LanguageContext2.getTranslation("allstacker.title.add_stacked_mobs", pl), LanguageContext2.getTranslation("allstacker.body.add_stacked_mobs", pl));
        addStackedUI.addDivider();
        const radius = 10;
        const nearEntities = pl.dimension.getEntities({
          location: pl.location,
          maxDistance: radius
        }).filter((en) => en.typeId !== "minecraft:player");
        const mobStackList = this.config.MobStackConfig.get("StackMob") || [];
        nearEntities.forEach((en) => {
          if (en.isValid && !mobStackList.includes(en.typeId)) {
            addStackedUI.addButton(`${EntityToName(en)}`, "", () => {
              mobStackList.push(en.typeId);
              this.config.MobStackConfig.set("StackMob", mobStackList);
              pl.sendMessage(LanguageContext2.getTranslation("allstacker.message.mob.added", pl).replace("%name", EntityToName(en)));
              page.showPage(pl, this.name + "_stacked");
            });
          }
        });
        if (nearEntities.filter((en) => en.isValid && !mobStackList.includes(en.typeId)).length === 0) {
          addStackedUI.addLabel(LanguageContext2.getTranslation("allstacker.label.no_stackable_mobs", pl));
        }
        addStackedUI.addDivider();
        addStackedUI.addButton(LanguageContext2.getTranslation("allstacker.button.back", pl), "", () => {
          page.showPage(pl, this.name + "_stacked");
        });
        page.addPage(this.name + "_add_stacked", addStackedUI);
        page.showPage(pl, this.name + "_add_stacked");
      });
      stackedUI.addButton(LanguageContext2.getTranslation("allstacker.button.remove_stacked_mobs", pl), "textures/ui/icon_book_writable", () => {
        const removeStackedUI = new IActionForm_default(LanguageContext2.getTranslation("allstacker.title.remove_stacked_mobs", pl), LanguageContext2.getTranslation("allstacker.body.remove_stacked_mobs", pl));
        removeStackedUI.addDivider();
        const mobStackList = this.config.MobStackConfig.get("StackMob") || [];
        if (mobStackList.length === 0) {
          removeStackedUI.addLabel(LanguageContext2.getTranslation("allstacker.label.no_stacked_mobs", pl));
        } else {
          mobStackList.forEach((mob) => {
            removeStackedUI.addButton(IdToName(mob), "", () => {
              const index = mobStackList.indexOf(mob);
              if (index > -1) {
                mobStackList.splice(index, 1);
                this.config.MobStackConfig.set("StackMob", mobStackList);
                pl.sendMessage(LanguageContext2.getTranslation("allstacker.message.mob.removed", pl).replace("%name", IdToName(mob)));
                page.showPage(pl, this.name + "_stacked");
              }
            });
          });
        }
        removeStackedUI.addDivider();
        removeStackedUI.addButton(LanguageContext2.getTranslation("allstacker.button.back", pl), "", () => {
          page.showPage(pl, this.name + "_stacked");
        });
        page.addPage(this.name + "_remove_stacked", removeStackedUI);
        page.showPage(pl, this.name + "_remove_stacked");
      });
      stackedUI.addButton(LanguageContext2.getTranslation("allstacker.button.view_stacked_mobs", pl), "textures/ui/icon_book_writable", () => {
        const mobStackList = this.config.MobStackConfig.get("StackMob") || [];
        const stackedMobsUI = new IActionForm_default(LanguageContext2.getTranslation("allstacker.title.view_stacked_mobs", pl), LanguageContext2.getTranslation("allstacker.body.view_stacked_mobs", pl));
        stackedMobsUI.addDivider();
        if (mobStackList.length === 0) {
          stackedMobsUI.addLabel(LanguageContext2.getTranslation("allstacker.label.no_stacked_mobs", pl));
        } else {
          mobStackList.forEach((mob) => {
            stackedMobsUI.addButton(IdToName(mob), "", () => {
              page.showPage(pl, this.name + "_stacked");
            });
          });
        }
        stackedMobsUI.addDivider();
        stackedMobsUI.addButton(LanguageContext2.getTranslation("allstacker.button.back", pl), "", () => {
          page.showPage(pl, this.name + "_stacked");
        });
        page.addPage(this.name + "_view_stacked", stackedMobsUI);
        page.showPage(pl, this.name + "_view_stacked");
      });
      stackedUI.addDivider();
      stackedUI.addButton(LanguageContext2.getTranslation("allstacker.button.back", pl), "", () => {
        page.showPage(pl, this.name);
      });
      page.addPage(this.name + "_stacked", stackedUI);
      page.showPage(pl, this.name + "_stacked");
    });
    configUI.addLabel(LanguageContext2.getTranslation("allstacker.label.mobstacker.advanced.description", pl));
    configUI.addButton(LanguageContext2.getTranslation("allstacker.button.advanced_settings", pl), "textures/ui/advanced_glyph_color", () => {
      const advancedSettingsUI = new IModalForm_default(LanguageContext2.getTranslation("allstacker.title.mob_advanced_settings", pl), LanguageContext2.getTranslation("allstacker.body.mob_advanced_settings", pl));
      advancedSettingsUI.addLabel(LanguageContext2.getTranslation("allstacker.label.mob_advanced.description", pl));
      advancedSettingsUI.addDivider();
      advancedSettingsUI.addToggle(LanguageContext2.getTranslation("allstacker.toggle.mobstacker", pl), PluginLoader.find((pl2) => pl2.name === this.name)?.setting.enabled || false);
      advancedSettingsUI.addDropdown(LanguageContext2.getTranslation("allstacker.dropdown.mob_death_mode", pl), ["All", "Only one"], this.config.MobStackConfig.get("MobDeathMode") === "All" ? 0 : 1);
      advancedSettingsUI.addSlider(LanguageContext2.getTranslation("allstacker.slider.radius_stacking", pl), 1, 100, 1, this.config.MobStackConfig.get("RadiusStacking") || 10);
      advancedSettingsUI.addTextField(LanguageContext2.getTranslation("allstacker.textfield.mob_display_text", pl), LanguageContext2.getTranslation("allstacker.textfield.mob_display_text.placeholder", pl), `${this.config.MobStackConfig.get("DisplayText") || "\xA77\xA7c\xA7l%a \xA7r%n\xA7r"}`);
      advancedSettingsUI.addCallback((formValues, canceled) => {
        if (canceled) return;
        const radius = formValues[4];
        const displayText = formValues[5];
        const mobDeathMode = formValues[3] === 0 ? "All" : "Only one";
        const isEnabled = formValues[2];
        const oldRadius = this.config.MobStackConfig.get("RadiusStacking") || 10;
        const oldDisplayText = this.config.MobStackConfig.get("DisplayText") || "\xA77\xA7c\xA7l%a \xA7r%n\xA7r";
        const oldEnabled = PluginLoader.find((pl2) => pl2.name === this.name)?.setting.enabled || false;
        const oldDeathMode = this.config.MobStackConfig.get("MobDeathMode") || "All";
        console.info(mobDeathMode, oldDeathMode);
        if (mobDeathMode !== oldDeathMode && mobDeathMode !== void 0) {
          this.config.MobStackConfig.set("MobDeathMode", mobDeathMode);
          pl.sendMessage(LanguageContext2.getTranslation("allstacker.message.mob_death_mode.changed", pl).replace("%value", mobDeathMode));
        }
        if (radius !== oldRadius && radius !== void 0) {
          this.config.MobStackConfig.set("RadiusStacking", radius);
          pl.sendMessage(LanguageContext2.getTranslation("allstacker.message.stacking_radius.changed", pl).replace("%value", radius.toString()));
        }
        if (displayText !== oldDisplayText && displayText !== void 0) {
          this.config.MobStackConfig.set("DisplayText", displayText);
          pl.sendMessage(LanguageContext2.getTranslation("allstacker.message.mob_display_text.changed", pl).replace("%value", displayText));
        }
        if (isEnabled !== oldEnabled && isEnabled !== void 0) {
          PluginLoader.find((pl2) => pl2.name === this.name).setting.enabled = isEnabled;
          ConfigMenu_default.setEnabled(this.name, isEnabled);
          const message = isEnabled ? LanguageContext2.getTranslation("allstacker.message.mobstacker.enabled", pl) : LanguageContext2.getTranslation("allstacker.message.mobstacker.disabled", pl);
          pl.sendMessage(message);
        }
      });
      advancedSettingsUI.setSubmitButton(LanguageContext2.getTranslation("allstacker.button.save_changes", pl));
      page.addPage(this.name + "_advanced_settings", advancedSettingsUI);
      page.showPage(pl, this.name + "_advanced_settings");
    });
    configUI.addDivider();
    configUI.addButton(LanguageContext2.getTranslation("allstacker.button.back", pl), "", () => {
      page.showPage(pl, "plugin-settings");
    });
    page.addPage(this.name, configUI);
    return true;
  }
  initializeConfig() {
    this.config = this.getConfig();
    this.config.MobStackConfig = new JsonDatabase("MobStackConfig", world9);
    if (!this.config.MobStackConfig.has("StackMob")) {
      this.config.MobStackConfig.set("StackMob", [
        "minecraft:pig",
        "minecraft:cow",
        "minecraft:sheep",
        "minecraft:chicken"
      ]);
    }
    if (!this.config.MobStackConfig.has("DisplayText")) {
      this.config.MobStackConfig.set("DisplayText", "\xA77\xA7c\xA7l%a \xA7r%n\xA7r");
    }
    if (!this.config.MobStackConfig.has("RadiusStacking")) {
      this.config.MobStackConfig.set("RadiusStacking", 10);
    }
    if (!this.config.MobStackConfig.has("MobDeathMode")) {
      this.config.MobStackConfig.set("MobDeathMode", "All");
    }
  }
};
var MobStacker_default = MobStacker;

// packs/scripts/kisux3/configs/PluginLoader.ts
var PluginLoader = [
  {
    name: "ConfigMenu",
    description: "Provides a configuration menu for plugins.",
    version: "1.0.0",
    main: new ConfigMenu_default("ConfigMenu", "Provides a configuration menu for plugins.", "1.0.0"),
    setting: {
      enabled: true,
      config: {
        PluginEnabled: null,
        LoadedConfig: false,
        Loadder: true
      }
    }
  },
  {
    name: "Item Stackers",
    description: "Manage item stacking configurations.",
    version: "1.0.0",
    main: new ItemStacker_default("Item Stackers", "Manage item stacking configurations.", "1.0.0"),
    setting: {
      enabled: true,
      config: {
        RadiusSeeing: null,
        ItemStackData: null,
        ItemListStack: /* @__PURE__ */ new Set(),
        SeeingItemStack: /* @__PURE__ */ new Set(),
        DimensionDataBackUp: null,
        PluginIcon: "textures/items/arrow",
        isLoaded: false
      }
    }
  },
  {
    name: "Mob Stacker",
    description: "Manage mob stacking configurations.",
    version: "1.0.0",
    main: new MobStacker_default("Mob Stacker", "Manage mob stacking configurations.", "1.0.0"),
    setting: {
      enabled: true,
      config: {
        ResetEntities: /* @__PURE__ */ new Set(),
        MobStackConfig: null,
        PluginIcon: "textures/items/spawn_eggs/spawn_egg_cow",
        isLoaded: false,
        Xp_Queue: /* @__PURE__ */ new Map()
      }
    }
  }
];

// packs/scripts/Index.ts
import { system as system8 } from "@minecraft/server";
var pluginManager = PluginManager.getInstance();
pluginManager.registerPlugins(PluginLoader);
KXEvents.on(null, "before:startup", (ev) => {
  pluginManager.startupPlugins(pluginManager.getPlugins(), ev);
});
KXEvents.on(null, "after:worldLoad", (ev) => {
  const loadder = PluginLoader.find((x) => x.setting.config?.Loadder);
  if (loadder) {
    loadder.main.onLoad(ev);
  }
  const i = system8.runInterval(() => {
    if (!loadder) return;
    if (loadder.setting.config.LoadedConfig) {
      system8.clearRun(i);
      pluginManager.getPlugins().filter((plugin) => plugin.name !== loadder.name).forEach((plugin) => {
        if (plugin.main.onLoad) {
          plugin.main.onLoad(ev);
        }
      });
    }
  }, 1);
});
KXEvents.on(null, "before:shutdown", (ev) => {
  pluginManager.shutdownPlugins(pluginManager.getPlugins(), ev);
});
//# sourceMappingURL=Index.js.map
