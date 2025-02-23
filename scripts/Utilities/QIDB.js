import { world, system, ItemStack, Player } from '@minecraft/server';
/**
 * @Class Quick Item Database V3.8-Stable by Carchi77
 * @Contributors Drag0nD - Coptaine
 * @ Made to fix script api's missing method to save items as object.
 * @ Optimized for low end devices while keeping fast loading times.
 * @ Does NOT impact ingame performance.
 * @ Uses entities inventory and structures.
 * @ Zero data loss: items are saved as a perfect clone.
**/
export class QIDB {
    /**
     * @param {string} namespace The unique namespace for the database keys.
     * @param {number} saveRate The rate of background saves per Tick (50ms), 1 is the recomended value for normal usage, you can use an higher rate if you need to save more than 1 key per tick (performance will be affected).
     * @param {boolean} logs If set to true, the database will log script latency in ms.
     * @param {number} QAMsize Quick Access Memory Size, the max amount of keys to keep quickly accessible. A small size can couse lag on frequent iterated usage, a large number can cause high hardware RAM usage.
     */
    constructor(namespace = "", saveRate = 2, QAMsize = 100, logs = false) {
        this.#saveRate = saveRate
        this.#settings = {
            logs: logs || false,
            namespace: namespace
        };
        this.#queuedKeys = []
        this.#queuedValues = []
        this.#quickAccess = new Map()
        this.#validNamespace = /^[a-z0-9_]*$/.test(this.#settings.namespace)
        this.#dimension = world.getDimension("overworld");

        let sl = world.scoreboard.getObjective('qidb')
        this.#sL;
        const player = world.getPlayers()[0]
        if (!this.#validNamespace) throw new Error(`§c[Item Database] ${namespace} isn't a valid namespace. accepted char: a-z 0-9 _`);
        if (player)
            if (!sl || sl?.hasParticipant('x') === false) {
                if (!sl) sl = world.scoreboard.addObjective('qidb');
                sl.setScore('x', player.location.x)
                sl.setScore('z', player.location.z)
                this.#sL = { x: sl.getScore('x'), y: 318, z: sl.getScore('z') }
                this.#dimension.runCommand(`/tickingarea add ${this.#sL.x} 319 ${this.#sL.z} ${this.#sL.x} 318 ${this.#sL.z} storagearea`);
                console.log(`§q[Item Database] is initialized successfully. namespace: ${this.#settings.namespace}`)
            } else {
                this.#sL = { x: sl.getScore('x'), y: 318, z: sl.getScore('z') }
                console.log(`§q[Item Database] is initialized successfully. namespace: ${this.#settings.namespace}`)
            }
        world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
            if (!this.#validNamespace) throw new Error(`§c[Item Database] ${namespace} isn't a valid namespace. accepted char: a-z 0-9 _`);
            if (!initialSpawn) return;
            if (!sl || sl?.hasParticipant('x') === false) {
                if (!sl) sl = world.scoreboard.addObjective('qidb');
                sl.setScore('x', player.location.x)
                sl.setScore('z', player.location.z)
                this.#sL = { x: sl.getScore('x'), y: 318, z: sl.getScore('z') }
                this.#dimension.runCommand(`/tickingarea add ${this.#sL.x} 319 ${this.#sL.z} ${this.#sL.x} 318 ${this.#sL.z} storagearea`);
                console.log(`§q[Item Database] is initialized successfully. namespace: ${this.#settings.namespace}`)
            } else {
                try {sl.getScore('x')} catch {console.log(`§c[Item Database] Initialization Error. namespace: ${this.#settings.namespace}`)}
                this.#sL = { x: sl.getScore('x'), y: 318, z: sl.getScore('z') }
                console.log(`§q[Item Database] is initialized successfully. namespace: ${this.#settings.namespace}`)
            }
        })

        let show = true
        let runId
        system.runInterval(() => {
            const diff = this.#quickAccess.size - QAMsize;
            if (diff > 0) {
                for (let i = 0; i < diff; i++) {
                    this.#quickAccess.delete(this.#quickAccess.keys().next().value);
                }

            }
            if (this.#queuedKeys.length) {
                show == true && console.log("§eSaving, Dont close the world.")

                if (!runId) runId = system.runInterval(() => {
                    console.log("§eSaving, Dont close the world.")
                }, 120)
                show = false
                const start = Date.now()
                const k = Math.min(this.#saveRate, this.#queuedKeys.length)
                for (let i = 0; i < k; i++) {
                    this.#romSave(this.#queuedKeys[0], this.#queuedValues[0]); if (logs) this.#timeWarn(start, this.#queuedKeys[0], "saved"); this.#queuedKeys.shift(); this.#queuedValues.shift()
                }
            } else if (runId) {
                system.clearRun(runId)
                runId = undefined
                show == false && console.log("§aSaved, You can now close the world safely.")
                show = true
            }
        })
        world.beforeEvents.playerLeave.subscribe(() => {
            if (this.#queuedKeys.length && world.getPlayers().length < 2) {
                console.error(
                    `\n\n\n\n§c[Item Database]-[Fatal Error] World closed too early, items not saved correctly. \n\n` +
                    `Namespace: ${this.#settings.namespace}\n` +
                    `Lost Keys amount: ${this.#queuedKeys.length}\n\n\n\n`
                )
            }
        })
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
        if (key.length > 30) throw new Error(`§c[Item Database] Out of range: <${key}> has more than 30 characters`)
        let canStr = false;
        try {
            world.structureManager.place(key, this.#dimension, this.#sL, { includeEntities: true });
            canStr = true;
        } catch {
            this.#dimension.spawnEntity("qidb:storage", this.#sL);
        }
        const entities = this.#dimension.getEntities({ location: this.#sL, type: "qidb:storage" });
        if (entities.length > 1) entities.forEach((e, index) => entities[index + 1]?.remove());
        const entity = entities[0];
        const inv = entity.getComponent("inventory").container;
        return { canStr, inv };
    }
    async #save(key, canStr) {
        if (canStr) world.structureManager.delete(key);
        world.structureManager.createFromWorld(key, this.#dimension, this.#sL, this.#sL, { saveMode: "World", includeEntities: true });
        const entities = this.#dimension.getEntities({ location: this.#sL, type: "qidb:storage" });
        entities.forEach(e => e.remove());
    }
    #timeWarn(time, key, action) {
        console.warn(`[Item Database] ${Date.now() - time}ms => ${action} ${key} `);
    }
    async #queueSaving(key, value) {
        this.#queuedKeys.push(key)
        this.#queuedValues.push(value)
    }
    async #romSave(key, value) {
        const { canStr, inv } = this.#load(key);
        if (!value) for (let i = 0; i < 256; i++) inv.setItem(i, undefined), world.setDynamicProperty(key, null);
        if (Array.isArray(value)) {
            try { for (let i = 0; i < 256; i++) inv.setItem(i, value[i] || undefined) } catch
            { throw new Error(`§c[Item Database] Invalid value type. supported: ItemStack | ItemStack[] | undefined`) }
            world.setDynamicProperty(key, true)
        } else {
            try { inv.setItem(0, value), world.setDynamicProperty(key, false) } catch
            { throw new Error(`§c[Item Database] Invalid value type. supported: ItemStack | ItemStack[] | undefined`) }
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
        if (!this.#validNamespace) throw new Error(`§c[Item Database] Invalid name: <${this.#settings.namespace}>. accepted char: a-z 0-9 _`);
        if (!/^[a-z0-9_]*$/.test(key)) throw new Error(`§c[Item Database] Invalid name: <${key}>. accepted char: a-z 0-9 _`);
        const time = Date.now();
        key = this.#settings.namespace + ":" + key;
        if (Array.isArray(value)) {
            if (value.length > 255) throw new Error(`§c[Item Database] Out of range: <${key}> has more than 255 ItemStacks`)
            world.setDynamicProperty(key, true)
        } else {
            world.setDynamicProperty(key, false)
        }
        this.#quickAccess.set(key, value)
        if (this.#queuedKeys.includes(key)) {
            const i = this.#queuedKeys.indexOf(key)
            this.#queuedValues.splice(i, 1)
            this.#queuedKeys.splice(i, 1)
        }
        this.#queueSaving(key, value)
        if (this.#settings.logs) this.#timeWarn(time, key, "set");
    }
    /**
     * Gets the value of a key from the item database.
     * @param {string} key The identifier of the value.
     * @returns {ItemStack | ItemStack[]} The `ItemStack` | `ItemStack[]` saved as `key`
     * @throws Throws if the key doesn't exist.
     */
    get(key) {
        if (!this.#validNamespace) throw new Error(`§c[Item Database] Invalid name: <${this.#settings.namespace}>. accepted char: a-z 0-9 _`);
        if (!/^[a-z0-9_]*$/.test(key)) throw new Error(`§c[Item Database] Invalid name: <${key}>. accepted char: a-z 0-9 _`);
        const time = Date.now();
        key = this.#settings.namespace + ":" + key;
        if (this.#quickAccess.has(key)) { if (this.#settings.logs) this.#timeWarn(time, key, "got"); return this.#quickAccess.get(key); }
        const structure = world.structureManager.get(key)
        if (!structure) throw new Error(`§c[Item Database] The key <${key}> doesn't exist.`);
        const { canStr, inv } = this.#load(key);
        const items = [];
        for (let i = 0; i < 256; i++) items.push(inv.getItem(i));
        for (let i = 255; i >= 0; i--) if (!items[i]) items.pop(); else break;
        this.#save(key, canStr);
        if (this.#settings.logs) this.#timeWarn(time, key, "got");
        if (world.getDynamicProperty(key)) { this.#quickAccess.set(key, items); return items }
        else { this.#quickAccess.set(key, items[0]); return items[0]; }
    }
    /**
     * Checks if a key exists in the item database.
     * @param {string} key The identifier of the value.
     * @returns {boolean}`true` if the key exists, `false` if the key doesn't exist.
     */
    has(key) {
        if (!this.#validNamespace) throw new Error(`§c[Item Database] Invalid name: <${this.#settings.namespace}>. accepted char: a-z 0-9 _`);
        if (!/^[a-z0-9_]*$/.test(key)) throw new Error(`§c[Item Database] Invalid name: <${key}>. accepted char: a-z 0-9 _`);
        const time = Date.now();
        key = this.#settings.namespace + ":" + key;
        const exist = this.#quickAccess.has(key) || world.structureManager.get(key)
        if (this.#settings.logs) this.#timeWarn(time, key, `has ${!!exist}`);
        if (exist) return true; else return false
    }
    /**
     * Deletes a key from the item database.
     * @param {string} key The identifier of the value.
     * @throws Throws if the key doesn't exist.
     */
    delete(key) {
        if (!this.#validNamespace) throw new Error(`§c[Item Database] Invalid name: <${this.#settings.namespace}>. accepted char: a-z 0-9 _`);
        if (!/^[a-z0-9_]*$/.test(key)) throw new Error(`§c[Item Database] Invalid name: <${key}>. accepted char: a-z 0-9 _`);
        const time = Date.now();
        key = this.#settings.namespace + ":" + key;
        if (this.#quickAccess.has(key)) this.#quickAccess.delete(key)
        const structure = world.structureManager.get(key)
        if (structure) world.structureManager.delete(key), world.setDynamicProperty(key, null);
        else throw new Error(`§c[Item Database] The key <${key}> doesn't exist.`);
        if (this.#settings.logs) this.#timeWarn(time, key, "removed");
    }
    /**
     * Gets all the keys of your namespace from item database.
     * @return {string[]} All the keys as an array of strings.
     */
    keys() {
        if (!this.#validNamespace) throw new Error(`§c[Item Database] Invalid name: <${this.#settings.namespace}>. accepted char: a-z 0-9 _`);
        const allIds = world.getDynamicPropertyIds()
        const ids = []
        allIds.filter(id => id.startsWith(this.#settings.namespace + ":")).forEach(id => ids.push(id.replace(this.#settings.namespace + ":", "")))
        return ids;
    }
    /**
     * Gets all the keys of your namespace from item database (takes some time if values aren't alredy loaded in quickAccess).
     * @return {ItemStack[][]} All the values as an array of ItemStack or ItemStack[].
     */
    values() {
        if (!this.#validNamespace) throw new Error(`§c[Item Database] Invalid name: <${this.#settings.namespace}>. accepted char: a-z 0-9 _`);
        const time = Date.now();
        const allIds = world.getDynamicPropertyIds()
        const values = []
        const filtered = allIds.filter(id => id.startsWith(this.#settings.namespace + ":")).map(id => id.replace(this.#settings.namespace + ":", ""))
        for (const key of filtered) {
            values.push(this.get(key));
        }
        if (this.#settings.logs) this.#timeWarn(time, `${JSON.stringify(values)}`, "values");
        return values;
    }
    /**
     * Clears all, CAN NOT REWIND.
     */
    clear() {
        if (!this.#validNamespace) throw new Error(`§c[Item Database] Invalid name: <${this.#settings.namespace}>. accepted char: a-z 0-9 _`);
        const time = Date.now();
        const allIds = world.getDynamicPropertyIds()
        const filtered = allIds.filter(id => id.startsWith(this.#settings.namespace + ":")).map(id => id.replace(this.#settings.namespace + ":", ""))
        for (const key of filtered) {
            this.delete(key)
        }
        if (this.#settings.logs) this.#timeWarn(time, ``, "clear");
    }
}