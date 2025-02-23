import { Dimension, EntityInventoryComponent, ItemStack, Player, Structure, Vector3, World } from '@minecraft/server';

/**
 * @class Quick Item Database V3.8-Stable by Carchi77
 * @contributors Drag0nD - Coptaine
 * @description Made to fix script API's missing method to save items as objects. Optimized for low-end devices while keeping fast loading times. Does NOT impact in-game performance. Uses entities' inventory and structures. Zero data loss: items are saved as a perfect clone.
 */
export declare class QIDB {
    /**
     * Constructs a new Quick Item Database instance.
     * @param namespace The unique namespace for the database keys. Defaults to an empty string.
     * @param saveRate The rate of background saves per tick (50ms). 1 is recommended for normal usage; higher rates can save more than 1 key per tick but may affect performance. Defaults to 2.
     * @param QAMsize Quick Access Memory Size, the maximum number of keys to keep quickly accessible. A small size may cause lag on frequent iterated usage; a large number may increase hardware RAM usage. Defaults to 100.
     * @param logs If true, the database logs script latency in milliseconds. Defaults to false.
     * @throws {Error} If the namespace contains invalid characters (only a-z, 0-9, and _ are allowed).
     */
    constructor(namespace?: string, saveRate?: number, QAMsize?: number, logs?: boolean);

    /**
     * Returns the current number of keys in Quick Access Memory (QAM).
     * @returns {number} The size of the quick access memory.
     */
    QAMusage(): number;

    /**
     * Sets a value as a key in the item database.
     * @param key The unique identifier of the value.
     * @param value The `ItemStack` or array of `ItemStack`s to set.
     * @throws {Error} If the namespace or key contains invalid characters (only a-z, 0-9, and _ are allowed).
     * @throws {Error} If `value` is an array with more than 255 items.
     */
    set(key: string, value: ItemStack[] | ItemStack): void;

    /**
     * Gets the value of a key from the item database.
     * @param key The identifier of the value.
     * @returns {ItemStack | ItemStack[]} The `ItemStack` or `ItemStack[]` saved as `key`.
     * @throws {Error} If the namespace or key contains invalid characters (only a-z, 0-9, and _ are allowed).
     * @throws {Error} If the key doesn’t exist.
     */
    get(key: string): ItemStack | ItemStack[];

    /**
     * Checks if a key exists in the item database.
     * @param key The identifier of the value.
     * @returns {boolean} `true` if the key exists, `false` if it doesn’t.
     * @throws {Error} If the namespace or key contains invalid characters (only a-z, 0-9, and _ are allowed).
     */
    has(key: string): boolean;

    /**
     * Deletes a key from the item database.
     * @param key The identifier of the value.
     * @throws {Error} If the namespace or key contains invalid characters (only a-z, 0-9, and _ are allowed).
     * @throws {Error} If the key doesn’t exist.
     */
    delete(key: string): void;

    /**
     * Gets all the keys of your namespace from the item database.
     * @returns {string[]} All the keys as an array of strings.
     * @throws {Error} If the namespace contains invalid characters (only a-z, 0-9, and _ are allowed).
     */
    keys(): string[];

    /**
     * Gets all the values of your namespace from the item database (takes some time if values aren’t already loaded in quickAccess).
     * @returns {Array<ItemStack | ItemStack[]>} All the values as an array of `ItemStack` or `ItemStack[]`.
     * @throws {Error} If the namespace contains invalid characters (only a-z, 0-9, and _ are allowed).
     */
    values(): Array<ItemStack | ItemStack[]>;

    /**
     * Clears all keys and values in the database. This action cannot be undone.
     * @throws {Error} If the namespace contains invalid characters (only a-z, 0-9, and _ are allowed).
     */
    clear(): void;

    // Private fields (not exposed in the public API but included for completeness)
    private readonly saveRate: number;
    private readonly validNamespace: boolean;
    private readonly queuedKeys: string[];
    private readonly settings: { logs: boolean; namespace: string };
    private readonly quickAccess: Map<string, ItemStack | ItemStack[]>;
    private readonly queuedValues: Array<ItemStack | ItemStack[]>;
    private readonly dimension: Dimension;
    private sL: { x: number; y: number; z: number } | undefined;

    // Private methods (not part of the public API but typed for internal clarity)
    private load(key: string): { canStr: boolean; inv: Container };
    private save(key: string, canStr: boolean): Promise<void>;
    private timeWarn(time: number, key: string, action: string): void;
    private queueSaving(key: string, value: ItemStack | ItemStack[]): Promise<void>;
    private romSave(key: string, value: ItemStack | ItemStack[]): Promise<void>;
}

// Ensure Container is typed appropriately (from EntityInventoryComponent)
interface Container {
    setItem(slot: number, item: ItemStack | undefined): void;
    getItem(slot: number): ItemStack | undefined;
}