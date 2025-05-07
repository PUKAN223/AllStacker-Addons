// scripts/Index.ts
import { system as system11, world as world17 } from "@minecraft/server";

// scripts/Configs/PluginConfigs.ts
import { world as world16 } from "@minecraft/server";

// scripts/Plugins/ItemStacker/index.ts
import { system as system7, world as world11 } from "@minecraft/server";

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

// scripts/Events/ItemUse/index.ts
import { world as world6 } from "@minecraft/server";
var CustomItemUse = class {
  constructor(enabled, callback) {
    world6.afterEvents.itemUse.subscribe((ev) => {
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
  ItemUse(callback) {
    new CustomItemUse(this.name, callback);
  }
};

// scripts/Plugins/ItemStacker/Configs/Database.ts
import { system as system3, world as world8 } from "@minecraft/server";

// scripts/Plugins/ItemStacker/Configs/con-database.js
import { world as world7, World, Entity, system as system2 } from "@minecraft/server";
import * as mc from "@minecraft/server";
var mc_world = world7;
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
    if (SOURCE_INSTANCES.has(source))
      return SOURCE_INSTANCES.get(source);
    if (source === mc_world)
      Object.assign(this, wP);
    else if (isValidEntity.call(source))
      Object.assign(this, eP);
    else
      throw new ReferenceError("Invald source type: " + source);
    SOURCE_INSTANCES.set(source, this);
  }
  /**@returns {string[]} */
  getIds() {
    return this.gDPI.call(this.source);
  }
  /**@param {string} key  @returns {number | boolean | string | import("@minecraft/server").Vector3}*/
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
    return this.source === world7 || isValidEntity.call(this.source);
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
    if (MAP_INSTANCES.has(PRE))
      return MAP_INSTANCES.get(PRE);
    MAP_INSTANCES.set(PRE, this);
    DDB_SUBINSTANCES.set(SOURCE, MAP_INSTANCES);
    if (!SOURCE.isValid())
      throw new ReferenceError("Source is no longer valid: " + SOURCE.source);
    this._prefix = PRE;
    this._prefixLength = LENGTH;
    this._STRINGIFY = parser.stringify;
    this._notDisposed = true;
    for (const K of SOURCE.getIds())
      if (K.startsWith(PRE)) {
        const key = K.substring(LENGTH);
        const value = SOURCE.get(K);
        if (typeof value === "string")
          super.set(key, PARSE(value));
      }
  }
  /**@param {string} key @param {any} value */
  set(key, value) {
    if (!this.isValid())
      throw new ReferenceError("This database instance is no longer valid");
    if (key.length + this._prefixLength > STRING_LIMIT)
      throw new TypeError("Key is too long: " + key.length);
    if (value === void 0) {
      this.delete(key);
      return this;
    }
    const data = this._STRINGIFY(value);
    if (data.length > STRING_LIMIT)
      throw new TypeError("Size of data in string is too long: " + data.length);
    this._source.set(this._prefix + key, data);
    return super.set(key, value);
  }
  /**@param {string} key  */
  delete(key) {
    if (!this.isValid())
      throw new ReferenceError("This database instance is no longer valid");
    if (!this.has(key))
      return false;
    this._source.delete(this._prefix + key);
    return super.delete(key);
  }
  clear() {
    if (!this.isValid())
      throw new ReferenceError("This database instance is no longer valid");
    const P = this._prefix;
    const s = this._source;
    for (const key of this.keys())
      s.delete(P + key);
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
  constructor(id, source = world7) {
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
  if (RootTable)
    return RootTable;
  return RootTable = world7.getDynamicProperty(ROOT_KEY) ? DATABASE_MANAGER.deserialize(ROOT_KEY, new DynamicSource(world7)) : (() => {
    const source = new DynamicSource(world7);
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
    if (SERIALIZERS.has(kind))
      throw new ReferenceError("Duplicate serialization kind: " + kind);
    if (typeof kind != "string")
      throw new TypeError("Kind must be type of string.");
    if (typeof serializer != "function" || typeof deserializer != "function")
      throw new TypeError("serializer or deserializer is not a function");
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
    if (!data)
      return null;
    return { ...data };
  },
  setSerializableClass(construct, kind, serializer, deserializer) {
    if (typeof serializer !== "function" || typeof deserializer !== "function")
      throw new TypeError("Serializer or deserializer is not a function");
    Serializer.registrySerializer(kind, function(obj) {
      if (obj == null)
        throw new TypeError("Null or Undefined is not possible to serialize.");
      return serializer(obj);
    }, function(obj) {
      if (obj[GENERATOR_DESERIALIZER_SYMBOL] !== true)
        throw new TypeError("Null or Undefined is not possible to serialize.");
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
    if (typeof kind != "string")
      throw new TypeError("Kind must be type of string.");
    if (typeof serializer != "function" || typeof deserializer != "function")
      throw new TypeError("serializer or deserializer is not a function");
    SERIALIZERS.set(kind, { serializer, deserializer });
    return kind;
  }
};
var DATABASE_MANAGER = {
  getHeader(rootRef, source) {
    const data = source.get(rootRef);
    if (typeof data != "string")
      return null;
    return JSONReadable(data);
  },
  serialize(rootRef, source, object) {
    if (!Serializer.isRegistredKind(Serializer.getSerializerKind(object)))
      throw new TypeError("object is not serializeable.");
    const kind = Serializer.getSerializerKind(object);
    const serializer = Serializer.getSerializer(kind);
    if (!serializer)
      throw new ReferenceError("No serializer for " + kind);
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
        if (headerData.length > TABLE_STRING_LENGTH)
          gen.throw(new RangeError("Yielded stirng is too big: " + headerData.length));
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
      for (let i = newLength; i < oldLength; i++)
        source.delete(prefix + i);
    }
  },
  deserialize(rootRef, source, header = void 0) {
    try {
      const oldHeader = header ?? this.getHeader(rootRef, source);
      if (!oldHeader)
        return null;
      const prefix = rootRef + "::";
      const [{ length: le, kind }, data] = oldHeader;
      let length = parseInt(le, 36);
      if (!Serializer.isRegistredKind(kind))
        throw new ReferenceError("Unknown parser kind: " + kind);
      const deserializeResolver = Serializer.getDeserializer(kind);
      if (!deserializeResolver)
        throw new ReferenceError("No deserializer for: " + kind);
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
      if (!data)
        throw new DataCoruptionError(source, root, "No continual data at index of " + i);
      yield data;
      i++;
    }
  },
  removeTree(rootRef, source) {
    const oldHeader = this.getHeader(rootRef, source);
    if (!oldHeader)
      return false;
    const prefix = rootRef + "::";
    const [{ length: le }] = oldHeader;
    let length = parseInt(le, 36);
    if (!isFinite(length))
      return false;
    for (let i = 0; i < length; i++)
      source.delete(prefix + i);
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
    if (!DESERIALIZER_INFO.has(this))
      throw new ReferenceError("Object bound to prototype does not exist.");
    return DESERIALIZER_INFO.get(this).source;
  },
  get rootKey() {
    if (!DESERIALIZER_INFO.has(this))
      throw new ReferenceError("Object bound to prototype does not exist.");
    return DESERIALIZER_INFO.get(this).rootRef;
  },
  get length() {
    if (!DESERIALIZER_INFO.has(this))
      throw new ReferenceError("Object bound to prototype does not exist.");
    return DESERIALIZER_INFO.get(this).length;
  },
  get kind() {
    if (!DESERIALIZER_INFO.has(this))
      throw new ReferenceError("Object bound to prototype does not exist.");
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
    if (!isNativeCall)
      throw new ReferenceError("No constructor for " + _DynamicTable.name);
    super();
  }
  get(key) {
    if (!this.isValid())
      throw new ReferenceError("Object bound to prototype doesn't not exist at [DynamicTable::get()].");
    if (!this.has(key))
      return;
    const source = TABLE_SOURCES.get(this);
    const dataId = super.get(key);
    return DATABASE_MANAGER.deserialize(dataId, source);
  }
  set(key, value) {
    if (!this.isValid())
      throw new ReferenceError("Object bound to prototype doesn't not exist at [DynamicTable::get()].");
    if (value == null)
      throw new ReferenceError("You can not assign property to null or undefined");
    if (!Serializer.isRegistredKind(Serializer.getSerializerKind(value)))
      throw new TypeError("value is not serializeable.");
    if (value instanceof _DynamicTable)
      throw new TypeError("You can't set value as DynamicTable please use AddTable");
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
    if (!this.isValid())
      throw new ReferenceError("Object bound to prototype doesn't not exist at [DynamicTable::clear()].");
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
    if (!this.isValid())
      throw new ReferenceError("Object bound to prototype doesn't not exist at [DynamicTable::delete()].");
    const source = TABLE_SOURCES.get(this);
    if (!this.has(key))
      return false;
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
    if (!this.isValid())
      throw new ReferenceError("Object bound to prototype doesn't not exist at [DynamicTable::entries()].");
    for (const [k, v] of super.entries())
      yield [k, this.get(k)];
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  *values() {
    if (!this.isValid())
      throw new ReferenceError("Object bound to prototype doesn't not exist at [DynamicTable::values()].");
    for (const k of super.keys())
      yield this.get(k);
  }
  isValid() {
    return !!(TABLE_VALIDS.has(this) && TABLE_SOURCES.get(this)?.isValid?.());
  }
  /**@returns {DynamicTable} */
  static OpenCreate(id) {
    let fromTable = getRootTable();
    let a = fromTable.get(id);
    if (a === void 0) {
      if (!fromTable.isValid())
        throw new ReferenceError("Object bound to prototype doesn't not exist at [DynamicTable::get()].");
      if (Map.prototype.has.call(fromTable, id))
        throw new ReferenceError("Value of this key already exists");
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
    } else if (!(a instanceof _DynamicTable))
      throw new TypeError(`Value saved in ${id} is not a dynamic table.`);
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
  if (!ID_TABLE.has(source))
    ID_TABLE.set(source, /* @__PURE__ */ new Map());
  ID_TABLE.get(source).set(rootRef, table);
}
var DataCoruptionError = class extends ReferenceError {
  constructor(source, rootKey, message) {
    super(message);
    this.rootKey = rootKey;
    this.source = source;
  }
  remove() {
    if (!this.source.isValid())
      throw new ReferenceError("Source is no longer valid");
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
    if (i)
      yield JSON.stringify(obj);
  },
  function(n) {
    if (GetTable(n.source, n.rootKey))
      return GetTable(n.source, n.rootKey);
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
      if (!data)
        throw new DataCoruptionError(n.source, n.rootKey, "Data for this dynamic table are corupted.");
      const obj = JSON.parse(data);
      for (const k of Object.getOwnPropertyNames(obj))
        set.call(table, k, obj[k]);
    }
    return table;
  }
);
Serializer.setSerializableClass(Boolean, SerializableKinds.Boolean, function* (n) {
  yield n;
}, function(n) {
  for (const a of n)
    return a === "true";
});
Serializer.setSerializableClass(Number, SerializableKinds.Number, function* (n) {
  yield n;
}, function(n) {
  for (const a of n)
    return Number(a);
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
      if (l <= 0)
        return;
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

// scripts/Plugins/ItemStacker/Configs/Database.ts
var itemStackData;
var UnStackItem;
var DisplayText;
var UnStackMob;
var isLoaded = false;
system3.run(() => {
  itemStackData = new JsonDatabase("ItemStacker", world8);
  UnStackItem = new JsonDatabase("UnStackItem", world8);
  DisplayText = new JsonDatabase("DisplayText", world8);
  if (!DisplayText.has("itemStack")) {
    DisplayText.set("itemStack", "\xA77x\xA7c%a \xA7e%n\xA7r\n\xA77Respawn in %m\xA7am \xA77%s\xA7as\xA7r");
  }
  UnStackMob = new JsonDatabase("UnStackMob", world8);
  if (UnStackMob.size == 0) {
    UnStackMob.set("minecraft:pig", true);
    UnStackMob.set("minecraft:cow", true);
    UnStackMob.set("minecraft:chicken", true);
    UnStackMob.set("minecraft:sheep", true);
  }
  isLoaded = true;
});
var ItemListStack = /* @__PURE__ */ new Set();

// scripts/Plugins/ItemStacker/Functions/GetStackItem.ts
import { system as system4, world as world9 } from "@minecraft/server";

// scripts/Plugins/ItemStacker/Functions/GetItemNearBy.ts
import { ItemEnchantableComponent as ItemEnchantableComponent2 } from "@minecraft/server";
function getItemNearBy(en, raduis = 7) {
  const itemNearBy = en.dimension.getEntities({ "maxDistance": raduis, "location": en.location, "type": "minecraft:item" }).filter((x) => {
    const item = en.getComponent("item").itemStack;
    const target = x.getComponent("item").itemStack;
    if ([...UnStackItem.keys()].some((x2) => x2 == target.typeId))
      return false;
    if (target.nameTag)
      return false;
    if (!itemStackData.has(x.id))
      return false;
    if (en.id == x.id)
      return false;
    if (item.getLore().join(",") !== target.getLore().join(","))
      return false;
    if (item.typeId !== target.typeId)
      return false;
    if (item.hasComponent(ItemEnchantableComponent2.componentId) && target.hasComponent(ItemEnchantableComponent2.componentId)) {
      const itemEn = item.getComponent(ItemEnchantableComponent2.componentId);
      const targetEn = target.getComponent(ItemEnchantableComponent2.componentId);
      if (itemEn.getEnchantments().map((x2) => x2.type.id).join(",") == targetEn.getEnchantments().map((x2) => x2.type.id).join(",")) {
        let isSame = true;
        for (const ench of itemEn.getEnchantments()) {
          if (ench.level !== targetEn.getEnchantment(ench.type).level) {
            isSame = false;
            break;
          }
        }
        if (!isSame)
          return false;
      } else
        return false;
    }
    return true;
  });
  return itemNearBy;
}

// scripts/Plugins/ItemStacker/Functions/GetStackItem.ts
function* StackingItem() {
  if (system4.currentTick % 2 !== 0) {
    for (const en of ItemListStack) {
      if (!en.isValid())
        continue;
      const item = en.getComponent("item").itemStack;
      let totalAmount = 0;
      if (!(item.nameTag || item.typeId.includes("potion") || [...UnStackItem.keys()].some((x) => x == item.typeId))) {
        for (const target of getItemNearBy(en)) {
          totalAmount += itemStackData.get(target.id).amount;
          if (itemStackData.has(target.id))
            itemStackData.delete(target.id);
          if (ItemListStack.has(target))
            ItemListStack.delete(target);
          target.addTag("fakeItem");
          target.remove();
        }
      }
      itemStackData.set(en.id, { amount: totalAmount + item.amount, item, life: system4.currentTick, currAmount: totalAmount });
      ItemListStack.delete(en);
      yield;
    }
  } else {
    for (const enData of itemStackData) {
      const en = world9.getDimension("overworld").getEntities().filter((x) => x.id == enData[0])[0];
      if (en && en.isValid()) {
        const data = itemStackData.get(en.id);
        const item = en.getComponent("item").itemStack;
        itemStackData.set(en.id, { amount: data.currAmount + item.amount, item: data.item, life: data.life, currAmount: data.currAmount });
      }
      yield;
    }
  }
  system4.run(() => system4.runJob(StackingItem()));
}

// scripts/Plugins/ItemStacker/Functions/SeeingItem.ts
import { system as system6, world as world10 } from "@minecraft/server";

// scripts/Plugins/ItemStacker/Functions/ItemToName.ts
function ItemsToName(entity) {
  return entity.getComponent("item").itemStack.nameTag ? entity.getComponent("item").itemStack.nameTag : entity.getComponent("item").itemStack.typeId.split(":")[1].split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

// scripts/Plugins/ItemStacker/Functions/GetTimeRemianing.ts
import { system as system5 } from "@minecraft/server";
function getTimeRemaining(minutes, seconds, referenceTick) {
  const now = system5.currentTick;
  const specifiedTimeTicks = (minutes * 60 + seconds) * 20;
  const targetTick = referenceTick + specifiedTimeTicks;
  let diffTicks = targetTick - now;
  const diffMinutes = Math.floor(diffTicks / (20 * 60));
  diffTicks -= diffMinutes * (20 * 60);
  const diffSeconds = Math.floor(diffTicks / 20);
  return { m: diffMinutes, s: diffSeconds };
}

// scripts/Plugins/ItemStacker/Functions/SeeingItem.ts
function* SeeingItem() {
  const ListStack = [...itemStackData.keys()];
  for (const pl of world10.getAllPlayers()) {
    const allEnititys = pl.dimension.getEntities({ type: "minecraft:item" }).filter((x) => ListStack.some((d) => d == x.id));
    const filterEntitys = pl.dimension.getEntities({ maxDistance: 15, location: pl.location, type: "minecraft:item" }).filter((x) => ListStack.some((d) => d == x.id));
    for (const en of filterEntitys) {
      const itemData = itemStackData.get(en.id);
      if (itemData && en.isValid() && isLoaded) {
        const timeData = getTimeRemaining(5, 30, itemData.life);
        let text = DisplayText.get("itemStack");
        text = text.replace(/%a/g, `${itemData.amount}`);
        text = text.replace(/%n/g, ItemsToName(en));
        text = text.replace(/%m/g, `${Math.max(timeData.m, 0)}`);
        text = text.replace(/%s/g, `${timeData.s}`);
        en.nameTag = text;
      }
      yield;
    }
    for (const en of allEnititys) {
      const itemData = itemStackData.get(en.id);
      if (itemData && en.isValid()) {
        const timeData = getTimeRemaining(5, 30, itemData.life);
        if (timeData.m < 0) {
          itemStackData.delete(en.id);
          en.addTag("fakeItem");
          en.remove();
        } else if (system6.currentTick % 20 == 0)
          en.nameTag = ``;
        yield;
      }
    }
    yield;
  }
  system6.runJob(SeeingItem());
}

// scripts/Plugins/ItemStacker/index.ts
var ItemStacker = class extends Plugins {
  constructor(name) {
    super(name);
    this.name = name;
  }
  setup() {
    system7.runJob(StackingItem());
    system7.runJob(SeeingItem());
  }
  init() {
    new CustomEvents(this.name).EntitySpawned((ev) => {
      if (ev.entity.typeId === "minecraft:item" && isLoaded && !itemStackData.has(ev.entity.id) && ev.entity.isValid() && !ev.entity.hasTag("fakeItem")) {
        ItemListStack.add(ev.entity);
      }
    });
    new CustomEvents(this.name).EntityRemoved((ev) => {
      if (ev.removedEntity.typeId !== "minecraft:item" || ev.removedEntity.hasTag("fakeItem") || ItemListStack.has(ev.removedEntity))
        return;
      const location = ev.removedEntity.location;
      const dim = ev.removedEntity.dimension.id;
      const id = ev.removedEntity.id;
      system7.run(() => {
        const itemData = itemStackData.get(id);
        if (!itemData)
          return;
        const itemToSpawn = itemData.amount - itemData.item.amount;
        if (itemToSpawn > 0) {
          const itemStackSpawn = itemData.item;
          if (itemToSpawn > itemData.item.maxAmount)
            itemStackSpawn.amount = itemData.item.maxAmount;
          else
            itemStackSpawn.amount = itemToSpawn;
          const enBase = world11.getDimension(dim).spawnItem(itemStackSpawn, location);
          enBase.teleport(location);
          const itemSetData = itemData;
          itemSetData.currAmount = itemData.currAmount - itemStackSpawn.amount;
          itemSetData.amount -= itemStackSpawn.amount;
          itemStackData.set(enBase.id, itemSetData);
        }
        itemStackData.delete(id);
      });
    });
  }
};

// scripts/Plugins/PluginManagers/index.ts
import { system as system8, world as world13 } from "@minecraft/server";

// scripts/Plugins/PluginManagers/Functions/LoadConfig.ts
import { world as world12 } from "@minecraft/server";
function loadPlugins(init = true, log = true) {
  for (let x of PluginConfigs_default().filter((x2) => x2.setting.isLoader !== true)) {
    world12.getAllPlayers().forEach((pl) => {
      if (x.setting.enabled) {
        if (init) {
          const pluginMain = new x.main(x.name);
          pluginMain.setup();
          pluginMain.init();
        }
        if (log)
          pl.sendMessage(`\xA77[\xA7r${x.name}\xA7r\xA77]\xA78:\xA7r \xA7a\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E40\u0E40\u0E25\u0E49\u0E27\xA77.\xA7r`);
      } else {
        if (log)
          pl.sendMessage(`\xA77[\xA7r${x.name}\xA7r\xA77]\xA78:\xA7r \xA7c\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\xA77.\xA7r`);
      }
    });
  }
}

// scripts/Plugins/PluginManagers/index.ts
var PluginManagers = class extends Plugins {
  constructor(name) {
    super(name);
  }
  setup() {
    system8.run(() => {
      world13.sendMessage(`\xA77[\xA7rConfig\xA7r\xA77]\xA78:\xA7r \xA7b\u0E42\u0E2B\u0E25\u0E14\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08.\xA77.\xA7r`);
    });
  }
  init() {
    function* run() {
      if (world13.getAllPlayers().length > 0) {
        loadPlugins(true);
      } else {
        system8.runJob(run());
      }
    }
    system8.runJob(run());
  }
};

// scripts/Plugins/MobStacker/index.ts
import { EntityDamageCause, system as system9, world as world14 } from "@minecraft/server";

// scripts/Plugins/MobStacker/Functions/GetEntitiesNearBy.ts
import { EntityLeashableComponent } from "@minecraft/server";
function getEntitiesNearBy(dimension, en, raduis = 10) {
  const allEn = dimension.getEntities({ location: en.location, maxDistance: raduis, type: en.typeId }).filter((x) => x.id !== en.id).filter((x) => !resetEntities.has(x)).filter((x) => x.hasComponent("is_baby") == en.hasComponent("is_baby")).filter((x) => x.getVelocity().x + x.getVelocity().y + x.getVelocity().z !== 0).filter((x) => !x.hasComponent("is_tamed")).filter((x) => {
    if (x.hasComponent(EntityLeashableComponent.componentId)) {
      const leashable = x.getComponent(EntityLeashableComponent.componentId);
      if (leashable.leashHolder)
        return false;
    }
    return true;
  }).filter((x) => x.getComponent("color")?.value == en.getComponent("color")?.value).filter((x) => {
    if (x.nameTag && en.nameTag && (x.nameTag.includes("\xA7m\xA7r\xA7c") && en.nameTag.includes("\xA7m\xA7r\xA7c")))
      return true;
    if (!(x.nameTag && en.nameTag))
      return true;
    return false;
  });
  return allEn;
}

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
    try {
      entityNew.triggerEvent("minecraft:entity_born");
    } catch {
    }
  } else {
    try {
      entityNew.triggerEvent("minecraft:ageable_grow_up");
    } catch {
    }
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
        system9.run(() => {
          const entityNew = spawnEntityClone(ev.target);
          ev.target.nameTag = ``;
          system9.runTimeout(() => {
            if (!ev.target.isValid)
              return;
            resetEntities.delete(ev.target);
          }, 300);
          resetEntities.add(ev.target);
          if (currAmount - 1 <= 1)
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
          if (currAmount - 1 <= 1)
            return;
          entityNew.nameTag = `\xA7e>> \xA7m\xA7r\xA7c${currAmount - 1}\xA7m\xA7r\xA7c\xA77x\xA7r \xA77${EntityToName(entityNew)}`;
        }
      }
    });
    new CustomEvents(this.name).Tick(40, () => {
      ["overworld", "nether", "the_end"].forEach(async (dimid) => {
        allEntities.clear();
        world14.getDimension(dimid).getEntities().filter((x) => !resetEntities.has(x)).filter((x) => [...UnStackMob.keys()].some((b) => b == x.typeId)).forEach((en) => {
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
          entity.nameTag = `\xA7e>> \xA7m\xA7r\xA7c${removedAmount + currAmount}\xA7m\xA7r\xA7c\xA77x\xA7r \xA77${EntityToName(entity)}`;
          allEntities.clear();
          world14.getDimension(dimid).getEntities().filter((x) => !resetEntities.has(x)).filter((x) => [...UnStackMob.keys()].some((b) => b == x.typeId)).forEach((en) => {
            allEntities.add(en);
          });
        }
      });
    });
  }
};

// scripts/Plugins/ItemMenus/index.ts
import { ActionFormData as ActionFormData2 } from "@minecraft/server-ui";

// scripts/Configs/SettingList.ts
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { system as system10 } from "@minecraft/server";

// scripts/Plugins/PluginManagers/Functions/SetConfig.ts
import { world as world15 } from "@minecraft/server";
function setConfig(name, bool) {
  let config2 = [];
  PluginConfigs_default().forEach((pl) => {
    if (pl.name == name) {
      config2.push({ ...pl, setting: { ...pl.setting, enabled: bool } });
    } else {
      config2.push(pl);
    }
  });
  world15.setDynamicProperty("pl-config", JSON.stringify(config2));
}

// scripts/Configs/SettingList.ts
var MobAdd = /* @__PURE__ */ new Map();
new CustomEvents("Plugin Managers").EntityInteract((ev) => {
  if (ev.player.hasTag("mobAdders")) {
    MobAdd.set(ev.player, ev.target.typeId);
  }
});
var formatName = (id) => id.split(":")[1].split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
var togglePlugin = (name, pl, enabled, callback) => {
  if (!enabled) {
    const state = !enabled;
    setConfig(name, state);
    pl.sendMessage(`\xA77[\xA7f${name}\xA77]\xA7r\xA7f:\xA7r ${state ? "\xA7a\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19" : "\xA7c\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19"}\xA77\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E2B\u0E32\u0E01\u0E44\u0E21\u0E48\u0E17\u0E33\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E49\xA7c\u0E2D\u0E2D\u0E01\u0E40\u0E01\u0E21\u0E40\u0E02\u0E49\u0E32\u0E43\u0E2B\u0E21\u0E48\u0E2D\u0E35\u0E01\u0E23\u0E2D\u0E1A\xA7r`);
    PluginConfigs_default();
    callback();
    return;
  }
  const ui = new MessageFormData().title("\xA78\u0E1B\u0E34\u0E14\u0E23\u0E30\u0E1A\u0E1A").body(`
\xA77\u0E04\u0E38\u0E13\u0E41\u0E19\u0E48\u0E43\u0E08\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\xA7c\u0E1B\u0E34\u0E14\xA77\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21${name.includes("Item") ? "\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21" : "\u0E21\u0E47\u0E2D\u0E1A"}
\u0E2B\u0E32\u0E01\xA7c\u0E1B\u0E34\u0E14\xA77\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 ${name.includes("Item") ? "\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21" : "\u0E21\u0E47\u0E2D\u0E1A"}\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E08\u0E30\u0E44\u0E21\u0E48\u0E17\u0E33\u0E07\u0E32\u0E19`).button1("\xA72\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19").button2("\xA7c\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A");
  ui.show(pl).then((res) => {
    if (res.canceled)
      return;
    if (res.selection === 1) {
      SettingSystems(pl, 0);
    } else {
      const state = !enabled;
      setConfig(name, state);
      pl.sendMessage(`\xA77[\xA7f${name}\xA77]\xA7r\xA7f:\xA7r ${state ? "\xA7a\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19" : "\xA7c\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19"}\xA77\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E2B\u0E32\u0E01\u0E44\u0E21\u0E48\u0E17\u0E33\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E49\xA7c\u0E2D\u0E2D\u0E01\u0E40\u0E01\u0E21\u0E40\u0E02\u0E49\u0E32\u0E43\u0E2B\u0E21\u0E48\u0E2D\u0E35\u0E01\u0E23\u0E2D\u0E1A\xA7r`);
      PluginConfigs_default();
    }
  });
};
var ListSetting = {
  "Item Stackers": (name, pl) => ({
    [`\xA7c\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 ${name}`]: (bool = false) => {
      if (bool)
        togglePlugin(name, pl, PluginConfigs_default().find((x) => x.name === name).setting.enabled, () => {
        });
      return PluginConfigs_default().find((x) => x.name === name).setting.enabled ? `\xA7c\u0E1B\u0E34\u0E14\xA78\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 ${name}` : `\xA72\u0E40\u0E1B\u0E34\u0E14\xA78\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 ${name}`;
    },
    "\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19": (bool = false) => {
      if (bool) {
        const items = [...UnStackItem.keys()];
        pl.sendMessage(items.length === 0 ? "\xA7c\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21" : `\xA77\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\xA7f:
\xA7f  -\xA7e${items.map(formatName).join("\xA7r\n  \xA7f-\xA7e")}`);
      }
      return null;
    },
    "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19": (bool = false) => {
      if (bool) {
        const selectItem = () => {
          pl.onScreenDisplay.setActionBar("\xA77\u0E01\u0E23\u0E38\u0E13\u0E32\u0E19\u0E33\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\u0E17\u0E35\u0E48\u0E08\u0E30\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E44\u0E27\u0E49\u0E43\u0E19\u0E0A\u0E48\u0E2D\u0E07\xA7c\u0E2A\u0E25\u0E47\u0E2D\u0E15\u0E41\u0E23\u0E01\xA77\u0E41\u0E25\u0E49\u0E27\xA7c\u0E01\u0E14\u0E22\u0E48\u0E2D\xA77");
          if (pl.isSneaking) {
            const item = pl.getComponent("inventory").container.getItem(0);
            if (item) {
              pl.playSound("random.pop");
              UnStackItem.set(item.typeId, true);
              pl.sendMessage(`\xA77[\xA7f${name}\xA77]\xA7r\xA7f:\xA7r \xA7a\u0E40\u0E1E\u0E34\u0E48\u0E21\xA77\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21 \xA7e${formatName(item.typeId)} \xA77\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\xA7r`);
            }
          } else {
            system10.run(selectItem);
          }
        };
        system10.run(selectItem);
      }
      return null;
    },
    "\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19": (bool = false) => {
      if (bool) {
        const items = [...UnStackItem.keys()];
        const ui = new ActionFormData().title("\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21").body("\n \u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\u0E17\u0E35\u0E48\u0E08\u0E30\u0E25\u0E1A\n ");
        items.map(formatName).forEach((btn) => ui.button(btn));
        ui.button("\u0E01\u0E25\u0E31\u0E1A");
        ui.show(pl).then((res) => {
          if (res.canceled || res.selection === items.length)
            return SettingSystems(pl, 0);
          const selectedItem = items[res.selection];
          const confirm = new MessageFormData().title("\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21").body(`\u0E04\u0E38\u0E13\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E25\u0E1A\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\u0E19\u0E35\u0E49 ${formatName(selectedItem)}
\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19\u0E44\u0E14\u0E49\u0E43\u0E0A\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48`).button1("\xA72\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19").button2("\xA7c\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A");
          confirm.show(pl).then((res2) => {
            if (res2.canceled)
              return;
            if (res2.selection === 0) {
              UnStackItem.delete(selectedItem);
              pl.sendMessage(`\xA77[\xA7f${name}\xA77]\xA7r\xA7f:\xA7r \xA7a\u0E25\u0E1A\xA77\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21 \xA7e${formatName(selectedItem)} \xA77\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\xA7r`);
            }
          });
        });
      }
      return null;
    },
    "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E01\u0E32\u0E23\u0E40\u0E40\u0E2A\u0E14\u0E07\u0E1C\u0E25\u0E08\u0E33\u0E19\u0E27\u0E19\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21": (bool = false) => {
      if (bool) {
        const ui = new ModalFormData().title("\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E01\u0E32\u0E23\u0E40\u0E40\u0E2A\u0E14\u0E07\u0E1C\u0E25").textField("\n \u0E43\u0E0A\u0E49 %%a \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E40\u0E2A\u0E14\u0E07\u0E08\u0E33\u0E19\u0E27\u0E19\n \u0E43\u0E0A\u0E49 %%n \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E40\u0E2A\u0E14\u0E07\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\n \u0E43\u0E0A\u0E49 %%m \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E40\u0E2A\u0E14\u0E07\u0E19\u0E32\u0E17\u0E35\u0E17\u0E35\u0E48\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\u0E08\u0E30\u0E16\u0E39\u0E01\u0E25\u0E1A\n \u0E43\u0E0A\u0E49 %%s \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E40\u0E2A\u0E14\u0E07\u0E27\u0E34\u0E19\u0E32\u0E17\u0E35\u0E17\u0E35\u0E48\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\u0E08\u0E30\u0E16\u0E39\u0E01\u0E25\u0E1A\n \u0E43\u0E0A\u0E49 \\n \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E27\u0E49\u0E19\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\n\u0E23\u0E39\u0E1B\u0E40\u0E40\u0E1A\u0E1A\u0E01\u0E32\u0E23\u0E40\u0E40\u0E2A\u0E14\u0E07", "", DisplayText.get("itemStack") ?? "\xA77x\xA7c%a \xA7e%n\xA7r\\n\xA77Respawn in %m\xA7am \xA77%s\xA7as\xA7r").toggle("\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32", false);
        ui.show(pl).then((res) => {
          if (res.canceled)
            return;
          const [displayFormat, reset] = res.formValues;
          if (reset) {
            DisplayText.set("itemStack", "\xA77x\xA7c%a \xA7e%n\xA7r\n\xA77Respawn in %m\xA7am \xA77%s\xA7as\xA7r");
            pl.sendMessage("\xA7a\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E17\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\xA7r");
          } else {
            DisplayText.set("itemStack", displayFormat);
            pl.sendMessage("\xA7a\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\xA7r");
          }
        });
      }
      return null;
    }
  }),
  "Mob Stackers": (name, pl) => {
    return {
      [`\xA7c\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 ${name}`]: (bool = false) => {
        if (bool)
          togglePlugin(name, pl, PluginConfigs_default().find((x) => x.name === name).setting.enabled, () => {
          });
        return PluginConfigs_default().find((x) => x.name === name).setting.enabled ? `\xA7c\u0E1B\u0E34\u0E14\xA78\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 ${name}` : `\xA72\u0E40\u0E1B\u0E34\u0E14\xA78\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 ${name}`;
      },
      "\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E47\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19": (bool = false) => {
        if (bool) {
          const mobs = [...UnStackMob.keys()];
          pl.sendMessage(mobs.length === 0 ? "\xA7c\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E47\u0E2D\u0E1A" : `\xA77\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E47\u0E2D\u0E1A\xA7f:
\xA7f  -\xA7e${mobs.map(formatName).join("\xA7r\n  \xA7f-\xA7e")}`);
        }
        return null;
      },
      "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E47\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19": (bool = false) => {
        if (bool) {
          let mobAdder2 = function() {
            pl.onScreenDisplay.setActionBar("\xA7c\u0E04\u0E25\u0E34\u0E01\u0E04\u0E49\u0E32\u0E07\u0E17\u0E35\u0E48\u0E21\u0E47\u0E2D\u0E1A\xA77\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E23\u0E37\u0E2D\xA7c\u0E01\u0E14\u0E22\u0E48\u0E2D\xA77\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01");
            if (pl.isSneaking)
              return;
            if (MobAdd.has(pl)) {
              UnStackMob.set(MobAdd.get(pl), true);
              pl.sendMessage(`\xA77[\xA7f${name}\xA77]\xA7r\xA7f:\xA7r \xA7a\u0E40\u0E1E\u0E34\u0E48\u0E21\xA77\u0E21\u0E47\u0E2D\u0E1A \xA7e${formatName(MobAdd.get(pl))} \xA77\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\xA7r`);
              MobAdd.delete(pl);
              pl.removeTag("mobAdders");
            } else {
              system10.run(mobAdder2);
            }
          };
          var mobAdder = mobAdder2;
          pl.addTag("mobAdders");
          system10.run(mobAdder2);
        }
        return null;
      },
      "\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E47\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19": (bool = false) => {
        if (bool) {
          const mobs = [...UnStackMob.keys()];
          const ui = new ActionFormData().title("\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E47\u0E2D\u0E1A").body("\n \u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E21\u0E47\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E08\u0E30\u0E25\u0E1A\n ");
          mobs.map(formatName).forEach((btn) => ui.button(btn));
          ui.button("\u0E01\u0E25\u0E31\u0E1A");
          ui.show(pl).then((res) => {
            if (res.canceled || res.selection === mobs.length)
              return SettingSystems(pl, 0);
            const selectedMob = mobs[res.selection];
            const confirm = new MessageFormData().title("\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E47\u0E2D\u0E1A").body(`\u0E04\u0E38\u0E13\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E25\u0E1A\u0E21\u0E47\u0E2D\u0E1A\u0E19\u0E35\u0E49 ${formatName(selectedMob)}
\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19\u0E44\u0E14\u0E49\u0E43\u0E0A\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48`).button1("\xA72\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19").button2("\xA7c\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A");
            confirm.show(pl).then((res2) => {
              if (res2.canceled)
                return;
              if (res2.selection === 0) {
                UnStackMob.delete(selectedMob);
                pl.sendMessage(`\xA77[\xA7f${name}\xA77]\xA7r\xA7f:\xA7r \xA7a\u0E25\u0E1A\xA77\u0E21\u0E47\u0E2D\u0E1A \xA7e${formatName(selectedMob)} \xA77\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\xA7r`);
              }
            });
          });
        }
        return null;
      }
    };
  }
};

// scripts/Plugins/ItemMenus/index.ts
var ItemMenus = class extends Plugins {
  constructor(name) {
    super(name);
    this.name = name;
  }
  setup() {
  }
  init() {
    new CustomEvents(this.name).ItemUse((ev) => {
      if (ev.itemStack.typeId == "kisu:ac_setting") {
        ListSystems(ev.source);
        ev.source.playSound("random.pop");
      }
    });
  }
};
function ListSystems(pl) {
  const listUi = new ActionFormData2();
  listUi.title("\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E23\u0E30\u0E1A\u0E1A");
  listUi.body(` 
 \xA7e\u0E2A\u0E27\u0E31\u0E2A\u0E14\u0E35\xA77, \xA7f${pl.name}
 \xA77\u0E04\u0E38\u0E13\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\xA7c\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\xA77\u0E23\u0E30\u0E1A\u0E1A\u0E15\u0E48\u0E32\u0E07\u0E46\u0E44\u0E14\u0E49\u0E1C\u0E48\u0E32\u0E19\u0E40\u0E21\u0E19\u0E39\u0E19\u0E35\u0E49

`);
  PluginConfigs_default().forEach((plg, i) => {
    if (!plg.setting.isLoader) {
      listUi.button(`${plg.name} [${plg.setting.enabled ? "\xA72\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\xA7r" : "\xA7c\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E40\u0E40\u0E25\u0E49\u0E27\xA7r"}]`, i % 2 == 0 ? `textures/ui/ImpulseSquare` : `textures/ui/ChainSquare`);
    }
  });
  listUi.button("\xA7c\u0E1B\u0E34\u0E14");
  listUi.show(pl).then((res) => {
    if (res.canceled)
      return;
    if (res.selection !== PluginConfigs_default().filter((x) => x.setting.isLoader == false).length) {
      SettingSystems(pl, res.selection);
    }
  });
}
function SettingSystems(pl, selected) {
  const listUi = new ActionFormData2();
  const data = Object.keys(ListSetting)[selected];
  listUi.title(`\xA78\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E23\u0E30\u0E1A\u0E1A \xA7f| \xA72${data}\xA7r`);
  listUi.body(` 
 \xA7e\u0E2A\u0E27\u0E31\u0E2A\u0E14\u0E35\xA77, \xA7f${pl.name}
 \xA77\u0E04\u0E38\u0E13\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\xA7c\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\xA77\u0E23\u0E30\u0E1A\u0E1A\u0E15\u0E48\u0E32\u0E07\u0E46\u0E44\u0E14\u0E49\u0E1C\u0E48\u0E32\u0E19\u0E40\u0E21\u0E19\u0E39\u0E19\u0E35\u0E49\xA7r

`);
  Object.keys(ListSetting[data](data, pl)).forEach((key) => {
    if (ListSetting[data](data, pl)[key]() == null) {
      listUi.button(key, "textures/ui/settings_glyph_color_2x");
    } else {
      listUi.button(ListSetting[data](data, pl)[key]().split(":")[0], ListSetting[data](data, pl)[key]().split(":")[1]);
    }
  });
  listUi.button("\xA7c\u0E01\u0E25\u0E31\u0E1A");
  listUi.show(pl).then((res) => {
    if (res.canceled)
      return;
    if (res.selection == Object.keys(ListSetting[data](data, pl)).length) {
      ListSystems(pl);
      return;
    } else {
      ListSetting[data](data, pl)[Object.keys(ListSetting[data](data, pl))[res.selection]](true);
      return;
    }
  });
}

// scripts/Configs/PluginConfigs.ts
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
  },
  {
    name: "ItemMenus",
    main: ItemMenus,
    setting: {
      enabled: true,
      isLoader: true
    }
  }
];
function allPlugins(reset = false) {
  if (JSON.parse(world16.getDynamicProperty("pl-config") ?? "[]").length !== config.length) {
    world16.sendMessage("\xA77[\xA7r\xA75Detected\xA7r\xA77]\xA78:\xA7r \xA77Configs \xA76Changed\xA77.\xA7r");
    world16.setDynamicProperty("pl-config", JSON.stringify(config));
  }
  const configR = [];
  config.forEach((pl, i) => {
    configR.push({
      name: reset ? pl.name : world16.getDynamicProperty("pl-config") !== void 0 ? JSON.parse(world16.getDynamicProperty("pl-config"))[i].name : pl.name,
      main: pl.main,
      setting: reset ? pl.setting : world16.getDynamicProperty("pl-config") !== void 0 ? JSON.parse(world16.getDynamicProperty("pl-config"))[i].setting : pl.setting
    });
  });
  return configR;
}
var PluginConfigs_default = allPlugins;

// scripts/Index.ts
function main() {
  PluginConfigs_default().filter((x) => x.setting.isLoader == true).forEach((x, i) => {
    const main2 = new x.main(x.name);
    main2.setup();
    main2.init();
  });
}
world17.afterEvents.worldInitialize.subscribe((ev) => {
  system11.run(main);
});

//# sourceMappingURL=../debug/Index.js.map
