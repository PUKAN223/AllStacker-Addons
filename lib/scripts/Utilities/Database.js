import * as mc from "@minecraft/server";
export default class DynamicProperties {
    /**
     * @param {string} dynamicName - The name of the dynamic property
     */
    constructor(dynamicName) {
        /**
         * @type {Map<string, Value>} DYNAMIC_MAP - The dynamic property map
         */
        this.DYNAMIC_MAP = new Map();
        if (dynamicName.length > 16 || dynamicName.length < 1)
            throw new Error("The length of the dynamic property name must be between 1 and 16");
        this.DYNAMIC_NAME = dynamicName;
        try {
            const data = mc.world.getDynamicProperty(this.DYNAMIC_NAME);
            const json = JSON.parse(data);
            for (const [key, vakue] of json) {
                this.DYNAMIC_MAP.set(key, vakue);
            }
        }
        catch (_a) {
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
        return [...Array(bytes)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }
}
//# sourceMappingURL=Database.js.map