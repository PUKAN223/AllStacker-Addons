// scripts/Index.ts
import { system as system9 } from "@minecraft/server";

// scripts/Configs/PluginConfigs.ts
import { world as world13 } from "@minecraft/server";

// scripts/Plugins/ItemStacker/index.ts
import { ItemStack as ItemStack3, MinecraftDimensionTypes, system as system5, world as world8 } from "@minecraft/server";

// scripts/Class/Plugins.ts
var Plugins = class {
  constructor(name) {
    this.pluginName = name;
  }
  setup() {
  }
  init() {
  }
};

// scripts/Events/EntitySpawned/index.ts
import { world } from "@minecraft/server";
var CustomEntitySpawned = class {
  constructor(enabled, callback) {
    world.afterEvents.entitySpawn.subscribe((ev) => {
      if (!PluginConfigs_default().find((x) => x.name == enabled).setting.enabled)
        return;
      callback(ev);
    });
  }
};

// scripts/Events/Tick/index.ts
import { system } from "@minecraft/server";
var CustomTick = class {
  constructor(enabled, delay, callback) {
    system.runInterval(() => {
      if (!PluginConfigs_default().find((x) => x.name == enabled).setting.enabled)
        return;
      callback();
    }, delay);
  }
};

// scripts/Events/EntityRemoved/index.ts
import { world as world3 } from "@minecraft/server";
var CustomEntityRemoved = class {
  constructor(enabled, callback) {
    world3.beforeEvents.entityRemove.subscribe((ev) => {
      if (!PluginConfigs_default().find((x) => x.name == enabled).setting.enabled)
        return;
      callback(ev);
    });
  }
};

// scripts/Events/EntityDie/index.ts
import { world as world4 } from "@minecraft/server";
var CustomEntityDie = class {
  constructor(enabled, callback) {
    world4.afterEvents.entityDie.subscribe((ev) => {
      if (!PluginConfigs_default().find((x) => x.name == enabled).setting.enabled)
        return;
      callback(ev);
    });
  }
};

// scripts/Events/InteractEntity/index.ts
import { world as world5 } from "@minecraft/server";
var CustomEntityInteract = class {
  constructor(enabled, callback) {
    world5.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
      if (!PluginConfigs_default().find((x) => x.name == enabled).setting.enabled)
        return;
      callback(ev);
    });
  }
};

// scripts/Events/CustomEvent.ts
var CustomEvents = class {
  constructor(name) {
    this.name = name;
  }
  EntitySpawned(callback) {
    new CustomEntitySpawned(this.name, callback);
  }
  EntityRemoved(callback) {
    new CustomEntityRemoved(this.name, callback);
  }
  EntityDie(callback) {
    new CustomEntityDie(this.name, callback);
  }
  EntityInteract(callback) {
    new CustomEntityInteract(this.name, callback);
  }
  Tick(delay, callback) {
    new CustomTick(this.name, delay, callback);
  }
};

// scripts/Utilities/Database.ts
import * as mc from "@minecraft/server";
var DynamicProperties = class {
  /**
   * @param {string} dynamicName - The name of the dynamic property
   */
  constructor(dynamicName) {
    /**  
     * @type {Map<string, Value>} DYNAMIC_MAP - The dynamic property map
     */
    this.DYNAMIC_MAP = /* @__PURE__ */ new Map();
    if (dynamicName.length > 16 || dynamicName.length < 1)
      throw new Error("The length of the dynamic property name must be between 1 and 16");
    this.DYNAMIC_NAME = dynamicName;
    try {
      const data2 = mc.world.getDynamicProperty(this.DYNAMIC_NAME);
      const json = JSON.parse(data2);
      for (const [key, vakue] of json) {
        this.DYNAMIC_MAP.set(key, vakue);
      }
    } catch {
      this.save();
    }
  }
  /**
   * @private save - Save the dynamic property
   */
  save() {
    mc.world.setDynamicProperty(this.DYNAMIC_NAME, JSON.stringify([...this.DYNAMIC_MAP]));
  }
  /**
   * @param {Key} key - The key of the dynamic property
   * @param {Value} value - The value of the dynamic property
   * @returns {DynamicProperties} - The dynamic property
   */
  set(key, value) {
    this.DYNAMIC_MAP.set(key, value);
    this.save();
    return this;
  }
  /**
   * @param {Key} key - The key of the dynamic property
   * @returns {boolean} - The result of the delete
   */
  delete(key) {
    const result = this.DYNAMIC_MAP.delete(key);
    this.save();
    return result;
  }
  /**
   * @returns {DynamicProperties} - The dynamic property
   */
  clear() {
    this.DYNAMIC_MAP.clear();
    this.save();
    return this;
  }
  /**
   * @param {Key} key - The key of the dynamic property
   * @returns {boolean} - The result of the has
   */
  has(key) {
    return this.DYNAMIC_MAP.has(key);
  }
  /**
   * @param {Key} key - The key of the dynamic property
   * @returns {Value} - The value of the dynamic property
   */
  get(key) {
    return this.DYNAMIC_MAP.get(key);
  }
  /**
   * @param {void} callbackfn - The callback of the dynamic property
   * @returns {void} - The result of the forEach
   */
  forEach(callbackfn, thisArg) {
    return this.DYNAMIC_MAP.forEach(callbackfn, thisArg);
  }
  /**
   * @returns {IterableIterator<string>} - The keys of the dynamic property
   */
  get keys() {
    return this.DYNAMIC_MAP.keys();
  }
  /**
   * @returns {IterableIterator<Value>} - The values of the dynamic property
   */
  get values() {
    return this.DYNAMIC_MAP.values();
  }
  /**
   * @returns {IterableIterator<[string, Value]>} - The entries of the dynamic property
   */
  get entries() {
    return this.DYNAMIC_MAP.entries();
  }
  /**
   * @param {Key} thisArg - The key of the dynamic property
   * @param {Value} callback - The value of the dynamic property
   * @returns {boolean} - The result of the some
   */
  find(callback, thisArg) {
    return [...this.DYNAMIC_MAP].find(callback, thisArg);
  }
  /**
   * @param {Key} thisArg - The key of the dynamic property
   * @param {Value} callback - The value of the dynamic property
   * @returns {T[]} - The entries of the dynamic property
   */
  map(callback, thisArg) {
    return [...this.DYNAMIC_MAP].map(callback, thisArg);
  }
  /**
   * @param {Key} thisArg - The key of the dynamic property
   * @param {Value} callback - The value of the dynamic property
   * @returns {[string, Value][]} - The entries of the dynamic property
   */
  filter(callback, thisArg) {
    return [...this.DYNAMIC_MAP].filter(callback, thisArg);
  }
  /**
   * @returns {number} - The size of the dynamic property
   */
  get size() {
    return this.DYNAMIC_MAP.size;
  }
  /**
   * @returns { string } - The key of the dynamic property
   */
  hex(bytes) {
    return [...Array(bytes)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
  }
};

// scripts/Utilities/QIDB.js
import { world as world7, system as system2, ItemStack, Player } from "@minecraft/server";
var QIDB = class {
  /**
   * @param {string} namespace The unique namespace for the database keys.
   * @param {number} saveRate The rate of background saves per Tick (50ms), 1 is the recomended value for normal usage, you can use an higher rate if you need to save more than 1 key per tick (performance will be affected).
   * @param {boolean} logs If set to true, the database will log script latency in ms.
   * @param {number} QAMsize Quick Access Memory Size, the max amount of keys to keep quickly accessible. A small size can couse lag on frequent iterated usage, a large number can cause high hardware RAM usage.
   */
  constructor(namespace = "", saveRate = 2, QAMsize = 100, logs = false) {
    this.#saveRate = saveRate;
    this.#settings = {
      logs: logs || false,
      namespace
    };
    this.#queuedKeys = [];
    this.#queuedValues = [];
    this.#quickAccess = /* @__PURE__ */ new Map();
    this.#validNamespace = /^[a-z0-9_]*$/.test(this.#settings.namespace);
    this.#dimension = world7.getDimension("overworld");
    let sl = world7.scoreboard.getObjective("qidb");
    this.#sL;
    const player = world7.getPlayers()[0];
    if (!this.#validNamespace)
      throw new Error(`\xA7c[Item Database] ${namespace} isn't a valid namespace. accepted char: a-z 0-9 _`);
    if (player)
      if (!sl || sl?.hasParticipant("x") === false) {
        if (!sl)
          sl = world7.scoreboard.addObjective("qidb");
        sl.setScore("x", player.location.x);
        sl.setScore("z", player.location.z);
        this.#sL = { x: sl.getScore("x"), y: 318, z: sl.getScore("z") };
        this.#dimension.runCommand(`/tickingarea add ${this.#sL.x} 319 ${this.#sL.z} ${this.#sL.x} 318 ${this.#sL.z} storagearea`);
        console.log(`\xA7q[Item Database] is initialized successfully. namespace: ${this.#settings.namespace}`);
      } else {
        this.#sL = { x: sl.getScore("x"), y: 318, z: sl.getScore("z") };
        console.log(`\xA7q[Item Database] is initialized successfully. namespace: ${this.#settings.namespace}`);
      }
    world7.afterEvents.playerSpawn.subscribe(({ player: player2, initialSpawn }) => {
      if (!this.#validNamespace)
        throw new Error(`\xA7c[Item Database] ${namespace} isn't a valid namespace. accepted char: a-z 0-9 _`);
      if (!initialSpawn)
        return;
      if (!sl || sl?.hasParticipant("x") === false) {
        if (!sl)
          sl = world7.scoreboard.addObjective("qidb");
        sl.setScore("x", player2.location.x);
        sl.setScore("z", player2.location.z);
        this.#sL = { x: sl.getScore("x"), y: 318, z: sl.getScore("z") };
        this.#dimension.runCommand(`/tickingarea add ${this.#sL.x} 319 ${this.#sL.z} ${this.#sL.x} 318 ${this.#sL.z} storagearea`);
        console.log(`\xA7q[Item Database] is initialized successfully. namespace: ${this.#settings.namespace}`);
      } else {
        try {
          sl.getScore("x");
        } catch {
          console.log(`\xA7c[Item Database] Initialization Error. namespace: ${this.#settings.namespace}`);
        }
        this.#sL = { x: sl.getScore("x"), y: 318, z: sl.getScore("z") };
        console.log(`\xA7q[Item Database] is initialized successfully. namespace: ${this.#settings.namespace}`);
      }
    });
    let show = true;
    let runId;
    system2.runInterval(() => {
      const diff = this.#quickAccess.size - QAMsize;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          this.#quickAccess.delete(this.#quickAccess.keys().next().value);
        }
      }
      if (this.#queuedKeys.length) {
        show == true && console.log("\xA7eSaving, Dont close the world.");
        if (!runId)
          runId = system2.runInterval(() => {
            console.log("\xA7eSaving, Dont close the world.");
          }, 120);
        show = false;
        const start = Date.now();
        const k = Math.min(this.#saveRate, this.#queuedKeys.length);
        for (let i = 0; i < k; i++) {
          this.#romSave(this.#queuedKeys[0], this.#queuedValues[0]);
          if (logs)
            this.#timeWarn(start, this.#queuedKeys[0], "saved");
          this.#queuedKeys.shift();
          this.#queuedValues.shift();
        }
      } else if (runId) {
        system2.clearRun(runId);
        runId = void 0;
        show == false && console.log("\xA7aSaved, You can now close the world safely.");
        show = true;
      }
    });
    world7.beforeEvents.playerLeave.subscribe(() => {
      if (this.#queuedKeys.length && world7.getPlayers().length < 2) {
        console.error(
          `



\xA7c[Item Database]-[Fatal Error] World closed too early, items not saved correctly. 

Namespace: ${this.#settings.namespace}
Lost Keys amount: ${this.#queuedKeys.length}



`
        );
      }
    });
  }
  #saveRate;
  #validNamespace;
  #queuedKeys;
  #settings;
  #quickAccess;
  #queuedValues;
  #dimension;
  #sL;
  QAMusage() {
    return this.#quickAccess.size;
  }
  #load(key) {
    if (key.length > 30)
      throw new Error(`\xA7c[Item Database] Out of range: <${key}> has more than 30 characters`);
    let canStr = false;
    try {
      world7.structureManager.place(key, this.#dimension, this.#sL, { includeEntities: true });
      canStr = true;
    } catch {
      this.#dimension.spawnEntity("qidb:storage", this.#sL);
    }
    const entities = this.#dimension.getEntities({ location: this.#sL, type: "qidb:storage" });
    if (entities.length > 1)
      entities.forEach((e, index) => entities[index + 1]?.remove());
    const entity = entities[0];
    const inv = entity.getComponent("inventory").container;
    return { canStr, inv };
  }
  async #save(key, canStr) {
    if (canStr)
      world7.structureManager.delete(key);
    world7.structureManager.createFromWorld(key, this.#dimension, this.#sL, this.#sL, { saveMode: "World", includeEntities: true });
    const entities = this.#dimension.getEntities({ location: this.#sL, type: "qidb:storage" });
    entities.forEach((e) => e.remove());
  }
  #timeWarn(time, key, action) {
    console.warn(`[Item Database] ${Date.now() - time}ms => ${action} ${key} `);
  }
  async #queueSaving(key, value) {
    this.#queuedKeys.push(key);
    this.#queuedValues.push(value);
  }
  async #romSave(key, value) {
    const { canStr, inv } = this.#load(key);
    if (!value)
      for (let i = 0; i < 256; i++)
        inv.setItem(i, void 0), world7.setDynamicProperty(key, null);
    if (Array.isArray(value)) {
      try {
        for (let i = 0; i < 256; i++)
          inv.setItem(i, value[i] || void 0);
      } catch {
        throw new Error(`\xA7c[Item Database] Invalid value type. supported: ItemStack | ItemStack[] | undefined`);
      }
      world7.setDynamicProperty(key, true);
    } else {
      try {
        inv.setItem(0, value), world7.setDynamicProperty(key, false);
      } catch {
        throw new Error(`\xA7c[Item Database] Invalid value type. supported: ItemStack | ItemStack[] | undefined`);
      }
    }
    this.#save(key, canStr);
  }
  /**
   * Sets a value as a key in the item database.
   * @param {string} key The unique identifier of the value.
   * @param {ItemStack[] | ItemStack} value The `ItemStack[]` or `itemStack` value to set.
   * @throws Throws if `value` is an array that has more than 255 items.
   */
  set(key, value) {
    if (!this.#validNamespace)
      throw new Error(`\xA7c[Item Database] Invalid name: <${this.#settings.namespace}>. accepted char: a-z 0-9 _`);
    if (!/^[a-z0-9_]*$/.test(key))
      throw new Error(`\xA7c[Item Database] Invalid name: <${key}>. accepted char: a-z 0-9 _`);
    const time = Date.now();
    key = this.#settings.namespace + ":" + key;
    if (Array.isArray(value)) {
      if (value.length > 255)
        throw new Error(`\xA7c[Item Database] Out of range: <${key}> has more than 255 ItemStacks`);
      world7.setDynamicProperty(key, true);
    } else {
      world7.setDynamicProperty(key, false);
    }
    this.#quickAccess.set(key, value);
    if (this.#queuedKeys.includes(key)) {
      const i = this.#queuedKeys.indexOf(key);
      this.#queuedValues.splice(i, 1);
      this.#queuedKeys.splice(i, 1);
    }
    this.#queueSaving(key, value);
    if (this.#settings.logs)
      this.#timeWarn(time, key, "set");
  }
  /**
   * Gets the value of a key from the item database.
   * @param {string} key The identifier of the value.
   * @returns {ItemStack | ItemStack[]} The `ItemStack` | `ItemStack[]` saved as `key`
   * @throws Throws if the key doesn't exist.
   */
  get(key) {
    if (!this.#validNamespace)
      throw new Error(`\xA7c[Item Database] Invalid name: <${this.#settings.namespace}>. accepted char: a-z 0-9 _`);
    if (!/^[a-z0-9_]*$/.test(key))
      throw new Error(`\xA7c[Item Database] Invalid name: <${key}>. accepted char: a-z 0-9 _`);
    const time = Date.now();
    key = this.#settings.namespace + ":" + key;
    if (this.#quickAccess.has(key)) {
      if (this.#settings.logs)
        this.#timeWarn(time, key, "got");
      return this.#quickAccess.get(key);
    }
    const structure = world7.structureManager.get(key);
    if (!structure)
      throw new Error(`\xA7c[Item Database] The key <${key}> doesn't exist.`);
    const { canStr, inv } = this.#load(key);
    const items = [];
    for (let i = 0; i < 256; i++)
      items.push(inv.getItem(i));
    for (let i = 255; i >= 0; i--)
      if (!items[i])
        items.pop();
      else
        break;
    this.#save(key, canStr);
    if (this.#settings.logs)
      this.#timeWarn(time, key, "got");
    if (world7.getDynamicProperty(key)) {
      this.#quickAccess.set(key, items);
      return items;
    } else {
      this.#quickAccess.set(key, items[0]);
      return items[0];
    }
  }
  /**
   * Checks if a key exists in the item database.
   * @param {string} key The identifier of the value.
   * @returns {boolean}`true` if the key exists, `false` if the key doesn't exist.
   */
  has(key) {
    if (!this.#validNamespace)
      throw new Error(`\xA7c[Item Database] Invalid name: <${this.#settings.namespace}>. accepted char: a-z 0-9 _`);
    if (!/^[a-z0-9_]*$/.test(key))
      throw new Error(`\xA7c[Item Database] Invalid name: <${key}>. accepted char: a-z 0-9 _`);
    const time = Date.now();
    key = this.#settings.namespace + ":" + key;
    const exist = this.#quickAccess.has(key) || world7.structureManager.get(key);
    if (this.#settings.logs)
      this.#timeWarn(time, key, `has ${!!exist}`);
    if (exist)
      return true;
    else
      return false;
  }
  /**
   * Deletes a key from the item database.
   * @param {string} key The identifier of the value.
   * @throws Throws if the key doesn't exist.
   */
  delete(key) {
    if (!this.#validNamespace)
      throw new Error(`\xA7c[Item Database] Invalid name: <${this.#settings.namespace}>. accepted char: a-z 0-9 _`);
    if (!/^[a-z0-9_]*$/.test(key))
      throw new Error(`\xA7c[Item Database] Invalid name: <${key}>. accepted char: a-z 0-9 _`);
    const time = Date.now();
    key = this.#settings.namespace + ":" + key;
    if (this.#quickAccess.has(key))
      this.#quickAccess.delete(key);
    const structure = world7.structureManager.get(key);
    if (structure)
      world7.structureManager.delete(key), world7.setDynamicProperty(key, null);
    else
      throw new Error(`\xA7c[Item Database] The key <${key}> doesn't exist.`);
    if (this.#settings.logs)
      this.#timeWarn(time, key, "removed");
  }
  /**
   * Gets all the keys of your namespace from item database.
   * @return {string[]} All the keys as an array of strings.
   */
  keys() {
    if (!this.#validNamespace)
      throw new Error(`\xA7c[Item Database] Invalid name: <${this.#settings.namespace}>. accepted char: a-z 0-9 _`);
    const allIds = world7.getDynamicPropertyIds();
    const ids = [];
    allIds.filter((id) => id.startsWith(this.#settings.namespace + ":")).forEach((id) => ids.push(id.replace(this.#settings.namespace + ":", "")));
    return ids;
  }
  /**
   * Gets all the keys of your namespace from item database (takes some time if values aren't alredy loaded in quickAccess).
   * @return {ItemStack[][]} All the values as an array of ItemStack or ItemStack[].
   */
  values() {
    if (!this.#validNamespace)
      throw new Error(`\xA7c[Item Database] Invalid name: <${this.#settings.namespace}>. accepted char: a-z 0-9 _`);
    const time = Date.now();
    const allIds = world7.getDynamicPropertyIds();
    const values = [];
    const filtered = allIds.filter((id) => id.startsWith(this.#settings.namespace + ":")).map((id) => id.replace(this.#settings.namespace + ":", ""));
    for (const key of filtered) {
      values.push(this.get(key));
    }
    if (this.#settings.logs)
      this.#timeWarn(time, `${JSON.stringify(values)}`, "values");
    return values;
  }
  /**
   * Clears all, CAN NOT REWIND.
   */
  clear() {
    if (!this.#validNamespace)
      throw new Error(`\xA7c[Item Database] Invalid name: <${this.#settings.namespace}>. accepted char: a-z 0-9 _`);
    const time = Date.now();
    const allIds = world7.getDynamicPropertyIds();
    const filtered = allIds.filter((id) => id.startsWith(this.#settings.namespace + ":")).map((id) => id.replace(this.#settings.namespace + ":", ""));
    for (const key of filtered) {
      this.delete(key);
    }
    if (this.#settings.logs)
      this.#timeWarn(time, ``, "clear");
  }
};

// scripts/Plugins/ItemStacker/Configs/Databases.ts
var itemStackMap = new QIDB("itemstacks");
var itemCode = new DynamicProperties("itemCodes");
var itemList = /* @__PURE__ */ new Set();
var SeeingItem = /* @__PURE__ */ new Set();

// scripts/Plugins/ItemStacker/Functions/GetItemAmount.ts
function getItemAmount(entity) {
  return parseInt(entity.getTags().find((x) => x.startsWith("amount:")).split(":")[1]) ?? entity.getComponent("item").itemStack.amount;
}

// scripts/Plugins/ItemStacker/Functions/IsRealItem.ts
function isRealItem(entity) {
  return entity.typeId == "minecraft:item" && !entity.hasTag("itemStacks");
}

// scripts/Plugins/ItemStacker/Functions/ItemToName.ts
function ItemsToName(entity) {
  return entity.getComponent("item").itemStack.typeId.split(":")[1].split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

// scripts/Plugins/ItemStacker/Functions/GetSizeStack.ts
function getSizeStack(current, amount, maxStack) {
  const remaining = amount - current;
  return [...Array(Math.floor(remaining / maxStack)).fill(maxStack), remaining % maxStack].filter(Boolean);
}

// scripts/Plugins/ItemStacker/Functions/GetStackItem.ts
import { ItemStack as ItemStack2, system as system4 } from "@minecraft/server";

// scripts/Plugins/ItemStacker/Functions/CombineItems.ts
import { system as system3 } from "@minecraft/server";

// scripts/Plugins/ItemStacker/Configs/DisabledItems.ts
var DisabledItem = ["minecraft:bundle", "shulker_box"];
var DisabledItems_default = DisabledItem;

// scripts/Plugins/ItemStacker/Functions/GetItemNearBy.ts
function getItemNearBy(dim, itemEn, raduis = 7) {
  return dim.getEntities({ location: itemEn.location, maxDistance: raduis, type: "minecraft:item", excludeTags: ["itemStacks"] }).filter((x) => x !== itemEn).filter((x) => x.getComponent("item").itemStack.typeId == itemEn.getComponent("item").itemStack.typeId).filter((x) => !x.getComponent("item").itemStack.hasComponent("enchantable")).filter((x) => x.getTags().some((x2) => x2.startsWith("amount:"))).filter((x) => !DisabledItems_default.some((e) => x.getComponent("item").itemStack.typeId.includes(e)));
}

// scripts/Plugins/ItemStacker/Functions/CombineItems.ts
function CombineItems(entity) {
  if (isRealItem(entity)) {
    const itemNearBy = getItemNearBy(entity.dimension, entity, 10);
    const tagFound = entity.getTags().find((x) => x.startsWith("amount:"));
    if (tagFound) {
      entity.removeTag(tagFound);
      entity.addTag(`amount:${itemNearBy.reduce((prev, crr) => prev + getItemAmount(crr), 0) + entity.getComponent("item").itemStack.amount}`);
    } else {
      entity.addTag(`amount:${itemNearBy.reduce((prev, crr) => prev + getItemAmount(crr), 0) + entity.getComponent("item").itemStack.amount}`);
    }
    itemNearBy.forEach(async (en) => {
      en.addTag("itemStacks");
      const code = itemCode.get(en.id);
      await system3.waitTicks(1);
      itemStackMap.delete(code);
      itemCode.delete(en.id);
      en.remove();
    });
  }
}

// scripts/Plugins/ItemStacker/Functions/RandomCode.ts
function randomCode(length) {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

// scripts/Plugins/ItemStacker/Functions/GetStackItem.ts
async function StackItem() {
  if (itemList.size !== 0) {
    for (let addedEntity of Array.from(itemList)) {
      CombineItems(addedEntity);
      const code = randomCode(6);
      const amount = new ItemStack2("minecraft:stick", 1);
      amount.nameTag = `${getItemAmount(addedEntity)}`;
      itemCode.set(addedEntity.id, code);
      await system4.waitTicks(1);
      itemStackMap.set(code, [addedEntity.getComponent("item").itemStack, amount]);
      itemList.delete(addedEntity);
    }
  }
  if (itemList.size !== 0) {
    return StackItem();
  } else {
    system4.run(StackItem);
  }
}

// scripts/Plugins/ItemStacker/index.ts
var ItemStacker = class extends Plugins {
  constructor(name) {
    super(name);
    this.name = name;
  }
  setup() {
  }
  init() {
    world8.beforeEvents.chatSend.subscribe(resetDB);
    function resetDB(ev) {
      if (ev.message == "!resetDB") {
        ev.cancel = true;
        system5.run(() => {
          itemCode.clear();
          itemStackMap.keys().forEach((m) => {
            itemStackMap.set(m, []);
            itemStackMap.delete(m);
          });
          itemStackMap.clear();
        });
      }
    }
    StackItem();
    new CustomEvents(this.name).Tick(20, () => {
      SeeingItem.clear();
      world8.getAllPlayers().forEach((pl) => {
        pl.dimension.getEntities({ type: "minecraft:item", excludeTags: ["itemStacks"], location: pl.location, maxDistance: 15 }).forEach((en) => {
          SeeingItem.add(en);
        });
      });
      Object.keys(MinecraftDimensionTypes).forEach((dim) => {
        world8.getDimension(MinecraftDimensionTypes[dim]).getEntities({ type: "minecraft:item", excludeTags: ["itemStacks"] }).filter((x) => x.getTags().some((x2) => x2.startsWith("amount:"))).forEach((en) => {
          if (!SeeingItem.has(en)) {
            en.nameTag = "";
          } else {
            en.nameTag = `\xA7e>> \xA7c${getItemAmount(en)}\xA77x\xA7r \xA77${ItemsToName(en)}`;
          }
        });
      });
    });
    new CustomEvents(this.name).EntityRemoved((ev) => {
      const { removedEntity } = ev;
      if (isRealItem(removedEntity) && !itemList.has(removedEntity)) {
        const removedItemCode = itemCode.get(removedEntity.id);
        let canceled = false;
        let removedData;
        try {
          removedData = itemStackMap.get(removedItemCode);
        } catch (e) {
          removedData = [new ItemStack3("minecraft:air", 1), new ItemStack3("minecraft:stick", 1)];
          canceled = true;
        }
        const removedItem = removedData[0];
        const realAmount = parseInt(removedData[1].nameTag);
        const removedDimension = removedEntity.dimension.id;
        const removedLocation = JSON.stringify(removedEntity.location);
        system5.run(() => {
          if (canceled)
            return;
          const size = getSizeStack(removedItem.amount, realAmount, removedItem.maxAmount);
          for (let i = 0; i < size.length; i++) {
            const items = removedItem;
            items.amount = size[i];
            const itemSpawn = world8.getDimension(removedDimension).spawnItem(items, JSON.parse(removedLocation));
            itemSpawn.addTag("itemStacks");
            system5.runTimeout(() => {
              if (itemSpawn.isValid()) {
                const itemSpawnDimension = itemSpawn.dimension.id;
                const itemSpawnLocation = JSON.stringify(itemSpawn.location);
                if (!itemSpawn.hasComponent("item"))
                  return;
                const itemSpawnItem = itemSpawn.getComponent("item")?.itemStack ?? null;
                if (itemSpawnItem == null)
                  return;
                itemSpawn.remove();
                world8.getDimension(itemSpawnDimension).spawnItem(itemSpawnItem, JSON.parse(itemSpawnLocation));
              }
            }, 20);
          }
          const code = itemCode.get(removedEntity.id);
          itemCode.delete(removedEntity.id);
          itemStackMap.delete(code);
        });
      }
    });
    new CustomEvents(this.name).EntitySpawned(async (ev) => {
      const { entity: addedEntity } = ev;
      if (isRealItem(addedEntity)) {
        await system5.waitTicks(5);
        if (addedEntity.isValid())
          itemList.add(addedEntity);
      }
    });
  }
};

// scripts/Plugins/PluginManagers/index.ts
import { system as system7, world as world11 } from "@minecraft/server";

// scripts/Plugins/PluginManagers/Functions/LoadConfig.ts
import { world as world9 } from "@minecraft/server";
function loadPlugins(init = true) {
  PluginConfigs_default().filter((x) => x.setting.isLoader !== true).forEach((x, i) => {
    world9.getAllPlayers().forEach((pl) => {
      if (pl.isOp()) {
        if (x.setting.enabled) {
          if (init) {
            const pluginMain = new x.main(x.name);
            pluginMain.setup();
            pluginMain.init();
          }
          pl.sendMessage(`\xA77[\xA7r${x.name}\xA7r\xA77]\xA78:\xA7r \xA7aEnabled\xA77.\xA7r`);
        } else {
          pl.sendMessage(`\xA77[\xA7r${x.name}\xA7r\xA77]\xA78:\xA7r \xA7cDisabled\xA77.\xA7r`);
        }
      }
    });
  });
}

// scripts/Plugins/PluginManagers/Functions/SettingForms.ts
import { system as system6 } from "@minecraft/server";
import { FormCancelationReason, ModalFormData } from "@minecraft/server-ui";

// scripts/Plugins/PluginManagers/Functions/SetConfig.ts
import { world as world10 } from "@minecraft/server";
function setConfig(name, bool) {
  let config2 = [];
  PluginConfigs_default().forEach((pl) => {
    if (pl.name == name) {
      config2.push({ ...pl, setting: { ...pl.setting, enabled: bool } });
    } else {
      config2.push(pl);
    }
  });
  world10.setDynamicProperty("pl-config", JSON.stringify(config2));
}

// scripts/Plugins/PluginManagers/Functions/SettingForms.ts
function showForm(pl) {
  const ui = new ModalFormData();
  ui.title(`\xA7cPlugin \xA7eManagers \xA78[Configs]`);
  PluginConfigs_default().filter((x) => !x.setting.isLoader).forEach((toggle) => {
    ui.toggle(toggle.name, toggle.setting.enabled);
  });
  ui.show(pl).then(async (res) => {
    if (res.cancelationReason == FormCancelationReason.UserBusy) {
      await new Promise((res2) => system6.runTimeout(res2, 20));
      showForm(pl);
      return;
    }
    PluginConfigs_default().filter((x) => !x.setting.isLoader).forEach((pl2, i) => {
      console.warn(res.formValues[i]);
      setConfig(pl2.name, res.formValues[i]);
    });
    loadPlugins(false);
  });
}

// scripts/Plugins/PluginManagers/index.ts
var PluginManagers = class extends Plugins {
  constructor(name) {
    super(name);
  }
  setup() {
    system7.run(() => {
      world11.sendMessage(`\xA77[\xA7rConfig\xA7r\xA77]\xA78:\xA7r \xA7bLoaded.\xA77.\xA7r`);
    });
  }
  init() {
    world11.afterEvents.worldInitialize.subscribe((ev) => {
      let i = system7.runInterval(() => {
        if (world11.getAllPlayers().length > 0) {
          loadPlugins();
          system7.clearRun(i);
        }
      }, 5);
    });
    world11.beforeEvents.chatSend.subscribe((ev) => {
      if (ev.message == "!plm-reset") {
        system7.run(() => {
          world11.setDynamicProperty("pl-config", JSON.stringify(PluginConfigs_default(true)));
          world11.getAllPlayers().forEach((pl) => {
            if (pl.isOp()) {
              world11.sendMessage(`\xA77[\xA7rConfig\xA7r\xA77]\xA78:\xA7r \xA7bReloaded\xA77.\xA7r`);
              loadPlugins(false);
            }
          });
        });
        ev.cancel = true;
      } else if (ev.message == "!plm-config") {
        system7.run(() => {
          showForm(ev.sender);
        });
        ev.cancel = true;
      }
    });
  }
};

// scripts/Plugins/MobStacker/index.ts
import { EntityDamageCause, MinecraftDimensionTypes as MinecraftDimensionTypes2, system as system8, world as world12 } from "@minecraft/server";

// scripts/Plugins/MobStacker/Functions/GetEntitiesNearBy.ts
function getEntitiesNearBy(dimension, en, raduis = 10) {
  const allEn = dimension.getEntities({ location: en.location, maxDistance: raduis, type: en.typeId }).filter((x) => x.id !== en.id).filter((x) => !resetEntities.has(x)).filter((x) => x.hasComponent("is_baby") == en.hasComponent("is_baby")).filter((x) => x.getVelocity().x + x.getVelocity().y + x.getVelocity().z !== 0).filter((x) => !x.hasComponent("is_tamed")).filter((x) => !x.getComponent("leashable").leashHolder).filter((x) => x.getComponent("color")?.value == en.getComponent("color")?.value);
  return allEn;
}

// scripts/Plugins/MobStacker/Configs/MobStackList.ts
var MobStackList = [
  "minecraft:cow",
  "minecraft:pig",
  "minecraft:sheep"
];

// scripts/Plugins/MobStacker/Functions/EntityToName.ts
function EntityToName(en) {
  return en.typeId.split(":")[1].split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

// scripts/Plugins/MobStacker/Functions/SpawnEntityClone.ts
import { EntityIsBabyComponent } from "@minecraft/server";
function spawnEntityClone(en) {
  const entityNew = en.dimension.spawnEntity(en.typeId, en.location);
  if (entityNew.hasComponent("color")) {
    entityNew.getComponent("color").value = en.getComponent("color").value;
  }
  if (en.hasComponent(EntityIsBabyComponent.componentId)) {
    entityNew.triggerEvent("minecraft:entity_born");
  } else {
    entityNew.triggerEvent("minecraft:ageable_grow_up");
  }
  return entityNew;
}

// scripts/Plugins/MobStacker/index.ts
var allEntities = /* @__PURE__ */ new Set();
var resetEntities = /* @__PURE__ */ new Set();
var MobStacker = class extends Plugins {
  constructor(name) {
    super(name);
    this.name = name;
  }
  setup() {
  }
  init() {
    new CustomEvents(this.name).EntityInteract((ev) => {
      if (ev.target.nameTag && ev.target.nameTag.includes("\xA7m\xA7r\xA7c")) {
        const currAmount = (ev.target.nameTag ?? "").includes("\xA7m\xA7r\xA7c") ? parseInt(ev.target.nameTag.split("\xA7m\xA7r\xA7c")[1]) : 1;
        system8.run(() => {
          const entityNew = spawnEntityClone(ev.target);
          ev.target.nameTag = ``;
          system8.runTimeout(() => {
            if (!ev.target.isValid())
              return;
            resetEntities.delete(ev.target);
          }, 100);
          resetEntities.add(ev.target);
          if (currAmount - 1 <= 0)
            return;
          entityNew.nameTag = `\xA7e>> \xA7m\xA7r\xA7c${currAmount - 1}\xA7m\xA7r\xA7c\xA77x\xA7r \xA77${EntityToName(entityNew)}`;
        });
      }
    });
    new CustomEvents(this.name).EntityDie((ev) => {
      if (ev.damageSource.cause == EntityDamageCause.none || ev.damageSource.cause == EntityDamageCause.selfDestruct)
        return;
      if (ev.deadEntity.nameTag && ev.deadEntity.nameTag.includes("\xA7m\xA7r\xA7c")) {
        const currAmount = (ev.deadEntity.nameTag ?? "").includes("\xA7m\xA7r\xA7c") ? parseInt(ev.deadEntity.nameTag.split("\xA7m\xA7r\xA7c")[1]) : 1;
        if (currAmount - 1 <= 0) {
          return;
        } else {
          const entityNew = spawnEntityClone(ev.deadEntity);
          entityNew.nameTag = `\xA7e>> \xA7m\xA7r\xA7c${currAmount - 1}\xA7m\xA7r\xA7c\xA77x\xA7r \xA77${EntityToName(entityNew)}`;
        }
      }
    });
    new CustomEvents(this.name).Tick(40, () => {
      Object.keys(MinecraftDimensionTypes2).forEach(async (dimid) => {
        allEntities.clear();
        world12.getDimension(MinecraftDimensionTypes2[dimid]).getEntities().filter((x) => !resetEntities.has(x)).filter((x) => MobStackList.some((b) => b == x.typeId)).forEach((en) => {
          allEntities.add(en);
        });
        for (const entity of allEntities) {
          let removedAmount = 0;
          const nearEntities = getEntitiesNearBy(entity.dimension, entity, 10);
          if (!nearEntities || nearEntities.length === 0) {
            continue;
          }
          for (const target of nearEntities) {
            const amount = (target.nameTag ?? "").includes("\xA7m\xA7r\xA7c") ? parseInt(target.nameTag.split("\xA7m\xA7r\xA7c")[1]) : 1;
            target.dimension.spawnParticle("minecraft:large_explosion", { ...target.location, y: target.location.y + 0.5 });
            target.remove();
            removedAmount += amount;
          }
          const currAmount = (entity.nameTag ?? "").includes("\xA7m\xA7r\xA7c") ? parseInt(entity.nameTag.split("\xA7m\xA7r\xA7c")[1]) : 1;
          console.warn(removedAmount, currAmount);
          entity.nameTag = `\xA7e>> \xA7m\xA7r\xA7c${removedAmount + currAmount}\xA7m\xA7r\xA7c\xA77x\xA7r \xA77${EntityToName(entity)}`;
          allEntities.clear();
          world12.getDimension(MinecraftDimensionTypes2[dimid]).getEntities().filter((x) => !resetEntities.has(x)).filter((x) => MobStackList.some((b) => b == x.typeId)).forEach((en) => {
            allEntities.add(en);
          });
        }
      });
    });
  }
};

// scripts/Configs/PluginConfigs.ts
var data = JSON.parse(world13.getDynamicProperty("pl-config") ?? "{}");
var config = [
  {
    name: "Plugin Managers",
    main: PluginManagers,
    setting: {
      enabled: true,
      isLoader: true
    }
  },
  {
    name: "Item Stackers",
    main: ItemStacker,
    setting: {
      enabled: true,
      isLoader: false
    }
  },
  {
    name: "Mob Stackers",
    main: MobStacker,
    setting: {
      enabled: true,
      isLoader: false
    }
  }
];
function allPlugins(reset = false) {
  if (JSON.parse(world13.getDynamicProperty("pl-config") ?? "[]").length !== config.length) {
    world13.sendMessage("\xA77[\xA7r\xA75Detected\xA7r\xA77]\xA78:\xA7r \xA77Configs \xA76Changed\xA77.\xA7r");
    world13.setDynamicProperty("pl-config", JSON.stringify(config));
  }
  const configR = [];
  config.forEach((pl, i) => {
    configR.push({
      name: reset ? pl.name : world13.getDynamicProperty("pl-config") !== void 0 ? JSON.parse(world13.getDynamicProperty("pl-config"))[i].name : pl.name,
      main: pl.main,
      setting: reset ? pl.setting : world13.getDynamicProperty("pl-config") !== void 0 ? JSON.parse(world13.getDynamicProperty("pl-config"))[i].setting : pl.setting
    });
  });
  return configR;
}
var PluginConfigs_default = allPlugins;

// scripts/Index.ts
function main() {
  const loaderPlugins = PluginConfigs_default().find((x) => x.setting.isLoader == true);
  console.warn(loaderPlugins);
  const loaderClass = new loaderPlugins.main(loaderPlugins.name);
  loaderClass.setup();
  loaderClass.init();
}
system9.run(main);

//# sourceMappingURL=../debug/Index.js.map
