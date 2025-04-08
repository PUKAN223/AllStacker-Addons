var _QIDB_instances, _QIDB_validNamespace, _QIDB_queuedKeys, _QIDB_settings, _QIDB_quickAccess, _QIDB_queuedValues, _QIDB_dimension, _QIDB_sL, _QIDB_load, _QIDB_save, _QIDB_queueSaving, _QIDB_romSave;
import { world, system, StructureSaveMode } from '@minecraft/server';
function date() {
    const date = new Date(Date.now());
    const ms = date.getMilliseconds().toString().padStart(3, "0");
    return `${date.toLocaleString().replace(' AM', `.${ms} AM`).replace(' PM', `.${ms} PM`)}`;
}
export class QIDB {
    constructor(namespace = "", cacheSize = 100, saveRate = 1) {
        _QIDB_instances.add(this);
        _QIDB_validNamespace.set(this, void 0);
        _QIDB_queuedKeys.set(this, []);
        _QIDB_settings.set(this, void 0);
        _QIDB_quickAccess.set(this, void 0);
        _QIDB_queuedValues.set(this, []);
        _QIDB_dimension.set(this, void 0);
        _QIDB_sL.set(this, void 0);
        __classPrivateFieldSet(this, _QIDB_quickAccess, new Map(), "f");
        system.run(() => {
            const self = this;
            __classPrivateFieldSet(this, _QIDB_settings, { namespace }, "f");
            __classPrivateFieldSet(this, _QIDB_validNamespace, /^[A-Za-z0-9_]*$/.test(__classPrivateFieldGet(this, _QIDB_settings, "f").namespace), "f");
            __classPrivateFieldSet(this, _QIDB_dimension, world.getDimension("overworld"), "f");
            this.logs = {
                startUp: true,
                save: true,
                load: true,
                set: true,
                get: true,
                has: true,
                delete: true,
                clear: true,
                values: true,
                keys: true,
            };
            function startLog() {
                console.log(`§qQIDB > is initialized successfully.§r namespace: ${__classPrivateFieldGet(self, _QIDB_settings, "f").namespace} §r${date()} `);
            }
            const VALID_NAMESPACE_ERROR = new Error(`§cQIDB > ${namespace} isn't a valid namespace. accepted char: A-Z a-z 0-9 _ §r${date()}`);
            let sl = world.scoreboard.getObjective('qidb');
            const player = world.getPlayers()[0];
            if (!__classPrivateFieldGet(this, _QIDB_validNamespace, "f"))
                throw VALID_NAMESPACE_ERROR;
            if (player) {
                if (!sl || !(sl === null || sl === void 0 ? void 0 : sl.hasParticipant('x'))) {
                    if (!sl)
                        sl = world.scoreboard.addObjective('qidb');
                    sl.setScore('x', player.location.x);
                    sl.setScore('z', player.location.z);
                    __classPrivateFieldSet(this, _QIDB_sL, { x: sl.getScore('x'), y: 318, z: sl.getScore('z') }, "f");
                    __classPrivateFieldGet(this, _QIDB_dimension, "f").runCommand(`/tickingarea add ${__classPrivateFieldGet(this, _QIDB_sL, "f").x} 319 ${__classPrivateFieldGet(this, _QIDB_sL, "f").z} ${__classPrivateFieldGet(this, _QIDB_sL, "f").x} 318 ${__classPrivateFieldGet(this, _QIDB_sL, "f").z} storagearea`);
                    startLog();
                }
                else {
                    __classPrivateFieldSet(this, _QIDB_sL, { x: sl.getScore('x'), y: 318, z: sl.getScore('z') }, "f");
                    startLog();
                }
            }
            world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
                if (!__classPrivateFieldGet(this, _QIDB_validNamespace, "f"))
                    throw VALID_NAMESPACE_ERROR;
                if (!initialSpawn)
                    return;
                if (!sl || !(sl === null || sl === void 0 ? void 0 : sl.hasParticipant('x'))) {
                    if (!sl)
                        sl = world.scoreboard.addObjective('qidb');
                    sl.setScore('x', player.location.x);
                    sl.setScore('z', player.location.z);
                    __classPrivateFieldSet(this, _QIDB_sL, { x: sl.getScore('x'), y: 318, z: sl.getScore('z') }, "f");
                    __classPrivateFieldGet(this, _QIDB_dimension, "f").runCommand(`/tickingarea add ${__classPrivateFieldGet(this, _QIDB_sL, "f").x} 319 ${__classPrivateFieldGet(this, _QIDB_sL, "f").z} ${__classPrivateFieldGet(this, _QIDB_sL, "f").x} 318 ${__classPrivateFieldGet(this, _QIDB_sL, "f").z} storagearea`);
                    startLog();
                }
                else {
                    __classPrivateFieldSet(this, _QIDB_sL, { x: sl.getScore('x'), y: 318, z: sl.getScore('z') }, "f");
                    startLog();
                }
            });
            let show = true;
            let runId;
            let lastam;
            system.runInterval(() => {
                var _a;
                const diff = __classPrivateFieldGet(self, _QIDB_quickAccess, "f").size - cacheSize;
                if (diff > 0) {
                    for (let i = 0; i < diff; i++) {
                        __classPrivateFieldGet(self, _QIDB_quickAccess, "f").delete((_a = __classPrivateFieldGet(self, _QIDB_quickAccess, "f").keys().next()) === null || _a === void 0 ? void 0 : _a.value);
                    }
                }
                if (__classPrivateFieldGet(self, _QIDB_queuedKeys, "f").length) {
                    if (!runId) {
                        log();
                        runId = system.runInterval(() => log(), 120);
                    }
                    show = false;
                    const k = Math.min(saveRate, __classPrivateFieldGet(this, _QIDB_queuedKeys, "f").length);
                    for (let i = 0; i < k; i++) {
                        __classPrivateFieldGet(this, _QIDB_instances, "m", _QIDB_romSave).call(this, __classPrivateFieldGet(this, _QIDB_queuedKeys, "f")[0], __classPrivateFieldGet(this, _QIDB_queuedValues, "f")[0]);
                        __classPrivateFieldGet(this, _QIDB_queuedKeys, "f").shift();
                        __classPrivateFieldGet(this, _QIDB_queuedValues, "f").shift();
                    }
                }
                else if (runId) {
                    system.clearRun(runId);
                    runId = undefined;
                    show === false && this.logs.save && console.log(`§aQIDB >Saved, You can now close the world safely. §r${date()}`);
                    show = true;
                }
            }, 1);
            function log() {
                const abc = (-(__classPrivateFieldGet(self, _QIDB_queuedKeys, "f").length - (lastam !== null && lastam !== void 0 ? lastam : 0)) / 6).toFixed(0) || '//';
                self.logs.save && console.log(`§eQIDB > Saving, Dont close the world.\n§r[Stats]-§eRemaining: ${__classPrivateFieldGet(self, _QIDB_queuedKeys, "f").length} keys | speed: ${abc} keys/s §r${date()}`);
                lastam = __classPrivateFieldGet(self, _QIDB_queuedKeys, "f").length;
            }
            world.beforeEvents.playerLeave.subscribe(() => {
                if (__classPrivateFieldGet(this, _QIDB_queuedKeys, "f").length && world.getPlayers().length < 2) {
                    console.error(`\n\n\n\n§cQIDB > Fatal Error > World closed too early, items not saved correctly.  \n\n` +
                        `Namespace: ${__classPrivateFieldGet(this, _QIDB_settings, "f").namespace}\n` +
                        `Lost Keys amount: ${__classPrivateFieldGet(this, _QIDB_queuedKeys, "f").length} §r${date()}\n\n\n\n`);
                }
            });
        });
    }
    set(key, value) {
        if (!__classPrivateFieldGet(this, _QIDB_validNamespace, "f"))
            throw new Error(`§cQIDB > Invalid name: <${__classPrivateFieldGet(this, _QIDB_settings, "f").namespace}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        if (!/^[A-Za-z0-9_]*$/.test(key))
            throw new Error(`§cQIDB > Invalid name: <${key}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        const time = Date.now();
        key = `${__classPrivateFieldGet(this, _QIDB_settings, "f").namespace}:${key}`;
        if (Array.isArray(value)) {
            if (value.length > 255)
                throw new Error(`§cQIDB > Out of range: <${key}> has more than 255 ItemStacks §r${date()}`);
            world.setDynamicProperty(key, true);
        }
        else {
            world.setDynamicProperty(key, false);
        }
        __classPrivateFieldGet(this, _QIDB_quickAccess, "f").set(key, value);
        if (__classPrivateFieldGet(this, _QIDB_queuedKeys, "f").includes(key)) {
            const i = __classPrivateFieldGet(this, _QIDB_queuedKeys, "f").indexOf(key);
            __classPrivateFieldGet(this, _QIDB_queuedValues, "f").splice(i, 1);
            __classPrivateFieldGet(this, _QIDB_queuedKeys, "f").splice(i, 1);
        }
        __classPrivateFieldGet(this, _QIDB_instances, "m", _QIDB_queueSaving).call(this, key, value);
        this.logs.set && console.log(`§aQIDB > Set key <${key}> succesfully. ${Date.now() - time}ms §r${date()}`);
    }
    get(key) {
        if (!__classPrivateFieldGet(this, _QIDB_validNamespace, "f"))
            throw new Error(`§cQIDB > Invalid name: <${__classPrivateFieldGet(this, _QIDB_settings, "f").namespace}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        if (!/^[A-Za-z0-9_]*$/.test(key))
            throw new Error(`§cQIDB > Invalid name: <${key}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        const time = Date.now();
        key = `${__classPrivateFieldGet(this, _QIDB_settings, "f").namespace}:${key}`;
        if (__classPrivateFieldGet(this, _QIDB_quickAccess, "f").has(key)) {
            this.logs.get && console.log(`§aQIDB > Got key <${key}> succesfully. ${Date.now() - time}ms §r${date()}`);
            return __classPrivateFieldGet(this, _QIDB_quickAccess, "f").get(key);
        }
        const structure = world.structureManager.get(key);
        if (!structure)
            throw new Error(`§cQIDB > The key < ${key} > doesn't exist.`);
        const { canStr, inv } = __classPrivateFieldGet(this, _QIDB_instances, "m", _QIDB_load).call(this, key);
        const items = [];
        for (let i = 0; i < 256; i++)
            items.push(inv.getItem(i));
        for (let i = 255; i >= 0; i--)
            if (!items[i])
                items.pop();
            else
                break;
        __classPrivateFieldGet(this, _QIDB_instances, "m", _QIDB_save).call(this, key, canStr);
        this.logs.get && console.log(`§aQIDB > Got items from <${key}> succesfully. ${Date.now() - time}ms §r${date()}`);
        const result = world.getDynamicProperty(key) ? items : items[0];
        __classPrivateFieldGet(this, _QIDB_quickAccess, "f").set(key, result);
        return result;
    }
    has(key) {
        if (!__classPrivateFieldGet(this, _QIDB_validNamespace, "f"))
            throw new Error(`§cQIDB > Invalid name: <${__classPrivateFieldGet(this, _QIDB_settings, "f").namespace}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        if (!/^[A-Za-z0-9_]*$/.test(key))
            throw new Error(`§cQIDB > Invalid name: <${key}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        const time = Date.now();
        key = `${__classPrivateFieldGet(this, _QIDB_settings, "f").namespace}:${key}`;
        const exist = __classPrivateFieldGet(this, _QIDB_quickAccess, "f").has(key) || !!world.structureManager.get(key);
        this.logs.has && console.log(`§aQIDB > Found key <${key}> succesfully. ${Date.now() - time}ms §r${date()}`);
        return exist;
    }
    delete(key) {
        if (!__classPrivateFieldGet(this, _QIDB_validNamespace, "f"))
            throw new Error(`§cQIDB > Invalid name: <${__classPrivateFieldGet(this, _QIDB_settings, "f").namespace}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        if (!/^[A-Za-z0-9_]*$/.test(key))
            throw new Error(`§cQIDB > Invalid name: <${key}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        const time = Date.now();
        key = `${__classPrivateFieldGet(this, _QIDB_settings, "f").namespace}:${key}`;
        if (__classPrivateFieldGet(this, _QIDB_quickAccess, "f").has(key))
            __classPrivateFieldGet(this, _QIDB_quickAccess, "f").delete(key);
        const structure = world.structureManager.get(key);
        if (structure) {
            world.structureManager.delete(key);
            world.setDynamicProperty(key, null);
        }
        else {
            throw new Error(`§cQIDB > The key <${key}> doesn't exist. §r${date()}`);
        }
        this.logs.delete && console.log(`§aQIDB > Deleted key <${key}> succesfully. ${Date.now() - time}ms §r${date()}`);
    }
    keys() {
        if (!__classPrivateFieldGet(this, _QIDB_validNamespace, "f"))
            throw new Error(`§cQIDB > Invalid name: <${__classPrivateFieldGet(this, _QIDB_settings, "f").namespace}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        const allIds = world.getDynamicPropertyIds();
        const ids = allIds
            .filter(id => id.startsWith(__classPrivateFieldGet(this, _QIDB_settings, "f").namespace + ":"))
            .map(id => id.replace(__classPrivateFieldGet(this, _QIDB_settings, "f").namespace + ":", ""));
        this.logs.keys && console.log(`§aQIDB > Got the list of all the ${ids.length} keys. §r${date()}`);
        return ids;
    }
    values() {
        if (!__classPrivateFieldGet(this, _QIDB_validNamespace, "f"))
            throw new Error(`§cQIDB > Invalid name: <${__classPrivateFieldGet(this, _QIDB_settings, "f").namespace}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        const time = Date.now();
        const allIds = world.getDynamicPropertyIds();
        const values = [];
        const filtered = allIds
            .filter(id => id.startsWith(__classPrivateFieldGet(this, _QIDB_settings, "f").namespace + ":"))
            .map(id => id.replace(__classPrivateFieldGet(this, _QIDB_settings, "f").namespace + ":", ""));
        for (const key of filtered) {
            values.push(this.get(key));
        }
        this.logs.values && console.log(`§aQIDB > Got the list of all the ${values.length} values. ${Date.now() - time}ms §r${date()}`);
        return values;
    }
    clear() {
        if (!__classPrivateFieldGet(this, _QIDB_validNamespace, "f"))
            throw new Error(`§cQIDB > Invalid name: <${__classPrivateFieldGet(this, _QIDB_settings, "f").namespace}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        const time = Date.now();
        const allIds = world.getDynamicPropertyIds();
        const filtered = allIds
            .filter(id => id.startsWith(__classPrivateFieldGet(this, _QIDB_settings, "f").namespace + ":"))
            .map(id => id.replace(__classPrivateFieldGet(this, _QIDB_settings, "f").namespace + ":", ""));
        for (const key of filtered) {
            this.delete(key);
        }
        this.logs.clear && console.log(`§aQIDB > Cleared, deleted ${filtered.length} values. ${Date.now() - time}ms §r${date()}`);
    }
}
_QIDB_validNamespace = new WeakMap(), _QIDB_queuedKeys = new WeakMap(), _QIDB_settings = new WeakMap(), _QIDB_quickAccess = new WeakMap(), _QIDB_queuedValues = new WeakMap(), _QIDB_dimension = new WeakMap(), _QIDB_sL = new WeakMap(), _QIDB_instances = new WeakSet(), _QIDB_load = function _QIDB_load(key) {
    if (key.length > 30)
        throw new Error(`§cQIDB > Out of range: <${key}> has more than 30 characters §r${date()}`);
    let canStr = false;
    try {
        world.structureManager.place(key, __classPrivateFieldGet(this, _QIDB_dimension, "f"), __classPrivateFieldGet(this, _QIDB_sL, "f"), { includeEntities: true });
        canStr = true;
    }
    catch (_a) {
        __classPrivateFieldGet(this, _QIDB_dimension, "f").spawnEntity("qidb:storage", __classPrivateFieldGet(this, _QIDB_sL, "f"));
    }
    const entities = __classPrivateFieldGet(this, _QIDB_dimension, "f").getEntities({ location: __classPrivateFieldGet(this, _QIDB_sL, "f"), type: "qidb:storage" });
    if (entities.length > 1)
        entities.forEach((e, index) => { var _a; return (_a = entities[index + 1]) === null || _a === void 0 ? void 0 : _a.remove(); });
    const entity = entities[0];
    const inv = entity.getComponent("minecraft:inventory").container;
    this.logs.load && console.log(`§aQIDB > Loaded entity <${key}> §r${date()}`);
    return { canStr, inv };
}, _QIDB_save = function _QIDB_save(key, canStr) {
    return __awaiter(this, void 0, void 0, function* () {
        if (canStr)
            world.structureManager.delete(key);
        world.structureManager.createFromWorld(key, __classPrivateFieldGet(this, _QIDB_dimension, "f"), __classPrivateFieldGet(this, _QIDB_sL, "f"), __classPrivateFieldGet(this, _QIDB_sL, "f"), { saveMode: StructureSaveMode.World, includeEntities: true });
        const entities = __classPrivateFieldGet(this, _QIDB_dimension, "f").getEntities({ location: __classPrivateFieldGet(this, _QIDB_sL, "f"), type: "qidb:storage" });
        entities.forEach(e => e.remove());
    });
}, _QIDB_queueSaving = function _QIDB_queueSaving(key, value) {
    return __awaiter(this, void 0, void 0, function* () {
        __classPrivateFieldGet(this, _QIDB_queuedKeys, "f").push(key);
        __classPrivateFieldGet(this, _QIDB_queuedValues, "f").push(value);
    });
}, _QIDB_romSave = function _QIDB_romSave(key, value) {
    return __awaiter(this, void 0, void 0, function* () {
        const { canStr, inv } = __classPrivateFieldGet(this, _QIDB_instances, "m", _QIDB_load).call(this, key);
        if (!value) {
            for (let i = 0; i < 256; i++)
                inv.setItem(i, undefined);
            world.setDynamicProperty(key, null);
        }
        if (Array.isArray(value)) {
            try {
                for (let i = 0; i < 256; i++)
                    inv.setItem(i, value[i] || undefined);
            }
            catch (_a) {
                throw new Error(`§cQIDB > Invalid value type. supported: ItemStack | ItemStack[] | undefined §r${date()}`);
            }
            world.setDynamicProperty(key, true);
        }
        else {
            try {
                inv.setItem(0, value);
                world.setDynamicProperty(key, false);
            }
            catch (_b) {
                throw new Error(`§cQIDB > Invalid value type. supported: ItemStack | ItemStack[] | undefined §r${date()}`);
            }
        }
        yield __classPrivateFieldGet(this, _QIDB_instances, "m", _QIDB_save).call(this, key, canStr);
    });
};
//# sourceMappingURL=QIDB.js.map