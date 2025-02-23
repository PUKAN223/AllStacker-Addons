import * as mc from "@minecraft/server";

export default class DynamicProperties<Value extends number | string | boolean | Object> {

    /**
     * @type {string} DYNAMIC_NAME - The name of the dynamic property
     */
    private DYNAMIC_NAME: string

    /**  
     * @type {Map<string, Value>} DYNAMIC_MAP - The dynamic property map
     */
    private DYNAMIC_MAP: Map<string, Value> = new Map<string, Value>()

    /**
     * @param {string} dynamicName - The name of the dynamic property
     */
    constructor(dynamicName: string) {
        if (dynamicName.length > 16 || dynamicName.length < 1)
            throw new Error("The length of the dynamic property name must be between 1 and 16");
        this.DYNAMIC_NAME = dynamicName
        try {
            const data = mc.world.getDynamicProperty(this.DYNAMIC_NAME) as string
            const json = JSON.parse(data)
            for (const [key, vakue] of json) {
                this.DYNAMIC_MAP.set(key, vakue)
            }
        } catch {
            this.save()
        }
    }
    /**
     * @private save - Save the dynamic property
     */
    private save() {
        mc.world.setDynamicProperty(this.DYNAMIC_NAME, JSON.stringify([...this.DYNAMIC_MAP]))
    }

    /**
     * @param {Key} key - The key of the dynamic property
     * @param {Value} value - The value of the dynamic property
     * @returns {DynamicProperties} - The dynamic property
     */
    public set(key: string, value: Value): this {
        this.DYNAMIC_MAP.set(key, value)
        this.save()
        return this
    }

    /**
     * @param {Key} key - The key of the dynamic property
     * @returns {boolean} - The result of the delete
     */
    public delete(key: string): boolean {
        const result = this.DYNAMIC_MAP.delete(key)
        this.save()
        return result
    }

    /**
     * @returns {DynamicProperties} - The dynamic property
     */
    public clear(): this {
        this.DYNAMIC_MAP.clear()
        this.save()
        return this
    }


    /**
     * @param {Key} key - The key of the dynamic property
     * @returns {boolean} - The result of the has
     */
    public has(key: string): boolean {
        return this.DYNAMIC_MAP.has(key)
    }

    /**
     * @param {Key} key - The key of the dynamic property
     * @returns {Value} - The value of the dynamic property
     */
    public get(key: string): Value {
        return this.DYNAMIC_MAP.get(key)
    }

    /**
     * @param {void} callbackfn - The callback of the dynamic property
     * @returns {void} - The result of the forEach
     */
    public forEach(callbackfn: (value: Value, key: string, map: Map<string, Value>) => void, thisArg?: any): void {
        return this.DYNAMIC_MAP.forEach(callbackfn, thisArg)
    }

    /**
     * @returns {IterableIterator<string>} - The keys of the dynamic property
     */
    public get keys(): IterableIterator<string> {
        return this.DYNAMIC_MAP.keys()
    }

    /**
     * @returns {IterableIterator<Value>} - The values of the dynamic property
     */
    public get values(): IterableIterator<Value> {
        return this.DYNAMIC_MAP.values()
    }

    /**
     * @returns {IterableIterator<[string, Value]>} - The entries of the dynamic property
     */
    public get entries(): IterableIterator<[string, Value]> {
        return this.DYNAMIC_MAP.entries()
    }

    /**
     * @param {Key} thisArg - The key of the dynamic property
     * @param {Value} callback - The value of the dynamic property
     * @returns {boolean} - The result of the some
     */
    public find(callback: (value: [string, Value], index: number, array: [string, Value][]) => boolean, thisArg?: any): [string, Value] {
        return [...this.DYNAMIC_MAP].find(callback, thisArg)
    }

    /**
     * @param {Key} thisArg - The key of the dynamic property
     * @param {Value} callback - The value of the dynamic property
     * @returns {T[]} - The entries of the dynamic property
     */
    public map<T>(callback: (value: [string, Value], index: number, array: [string, Value][]) => T, thisArg?: any): T[] {
        return [...this.DYNAMIC_MAP].map(callback, thisArg)
    }

    /**
     * @param {Key} thisArg - The key of the dynamic property
     * @param {Value} callback - The value of the dynamic property
     * @returns {[string, Value][]} - The entries of the dynamic property
     */
    public filter(callback: (value: [string, Value], index: number, array: [string, Value][]) => boolean, thisArg?: any): [string, Value][] {
        return [...this.DYNAMIC_MAP].filter(callback, thisArg)
    }

    /**
     * @returns {number} - The size of the dynamic property
     */
    public get size(): number {
        return this.DYNAMIC_MAP.size
    }

    /**
     * @returns { string } - The key of the dynamic property
     */
    public hex(bytes: number): string {
        return [...Array(bytes)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
    }
}