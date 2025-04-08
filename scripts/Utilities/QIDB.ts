import { world, system, ItemStack, Player, Dimension, Vector3, EntityInventoryComponent, StructureSaveMode } from '@minecraft/server';

function date(): string {
    const date = new Date(Date.now());
    const ms = date.getMilliseconds().toString().padStart(3, "0");
    return `${date.toLocaleString().replace(' AM', `.${ms} AM`).replace(' PM', `.${ms} PM`)}`;
}

interface QIDBSettings {
    namespace: string;
}

interface QIDBLogs {
    startUp: boolean;
    save: boolean;
    load: boolean;
    set: boolean;
    get: boolean;
    has: boolean;
    delete: boolean;
    clear: boolean;
    values: boolean;
    keys: boolean;
}

export class QIDB {
    logs: QIDBLogs;
    #validNamespace: boolean;
    #queuedKeys: string[] = [];
    #settings: QIDBSettings;
    #quickAccess: Map<string, ItemStack | ItemStack[]>;
    #queuedValues: (ItemStack | ItemStack[] | undefined)[] = [];
    #dimension: Dimension;
    #sL: Vector3;

    constructor(namespace: string = "", cacheSize: number = 100, saveRate: number = 1) {
        this.#quickAccess = new Map();
        system.run(() => {
            const self = this;
            this.#settings = { namespace };
            this.#validNamespace = /^[A-Za-z0-9_]*$/.test(this.#settings.namespace);
            this.#dimension = world.getDimension("overworld");
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

            function startLog(): void {
                console.log(
                    `§qQIDB > is initialized successfully.§r namespace: ${self.#settings.namespace} §r${date()} `
                );
            }

            const VALID_NAMESPACE_ERROR = new Error(`§cQIDB > ${namespace} isn't a valid namespace. accepted char: A-Z a-z 0-9 _ §r${date()}`);
            let sl = world.scoreboard.getObjective('qidb');
            const player: Player | undefined = world.getPlayers()[0];

            if (!this.#validNamespace) throw VALID_NAMESPACE_ERROR;
            if (player) {
                if (!sl || !sl?.hasParticipant('x')) {
                    if (!sl) sl = world.scoreboard.addObjective('qidb');
                    sl.setScore('x', player.location.x);
                    sl.setScore('z', player.location.z);
                    this.#sL = { x: sl.getScore('x'), y: 318, z: sl.getScore('z') };
                    this.#dimension.runCommand(`/tickingarea add ${this.#sL.x} 319 ${this.#sL.z} ${this.#sL.x} 318 ${this.#sL.z} storagearea`);
                    startLog();
                } else {
                    this.#sL = { x: sl.getScore('x'), y: 318, z: sl.getScore('z') };
                    startLog();
                }
            }

            world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
                if (!this.#validNamespace) throw VALID_NAMESPACE_ERROR;
                if (!initialSpawn) return;
                if (!sl || !sl?.hasParticipant('x')) {
                    if (!sl) sl = world.scoreboard.addObjective('qidb');
                    sl.setScore('x', player.location.x);
                    sl.setScore('z', player.location.z);
                    this.#sL = { x: sl.getScore('x'), y: 318, z: sl.getScore('z') };
                    this.#dimension.runCommand(`/tickingarea add ${this.#sL.x} 319 ${this.#sL.z} ${this.#sL.x} 318 ${this.#sL.z} storagearea`);
                    startLog();
                } else {
                    this.#sL = { x: sl.getScore('x'), y: 318, z: sl.getScore('z') };
                    startLog();
                }
            });

            let show: boolean = true;
            let runId: number | undefined;
            let lastam: number | undefined;

            system.runInterval(() => {
                const diff = self.#quickAccess.size - cacheSize;
                if (diff > 0) {
                    for (let i = 0; i < diff; i++) {
                        self.#quickAccess.delete(self.#quickAccess.keys().next()?.value);
                    }
                }
                if (self.#queuedKeys.length) {
                    if (!runId) {
                        log();
                        runId = system.runInterval(() => log(), 120);
                    }
                    show = false;
                    const k = Math.min(saveRate, this.#queuedKeys.length);
                    for (let i = 0; i < k; i++) {
                        this.#romSave(this.#queuedKeys[0], this.#queuedValues[0]);
                        this.#queuedKeys.shift();
                        this.#queuedValues.shift();
                    }
                } else if (runId) {
                    system.clearRun(runId);
                    runId = undefined;
                    show === false && this.logs.save && console.log(`§aQIDB >Saved, You can now close the world safely. §r${date()}`);
                    show = true;
                }
            }, 1);

            function log(): void {
                const abc = (-(self.#queuedKeys.length - (lastam ?? 0)) / 6).toFixed(0) || '//';
                self.logs.save && console.log(`§eQIDB > Saving, Dont close the world.\n§r[Stats]-§eRemaining: ${self.#queuedKeys.length} keys | speed: ${abc} keys/s §r${date()}`);
                lastam = self.#queuedKeys.length;
            }

            world.beforeEvents.playerLeave.subscribe(() => {
                if (this.#queuedKeys.length && world.getPlayers().length < 2) {
                    console.error(
                        `\n\n\n\n§cQIDB > Fatal Error > World closed too early, items not saved correctly.  \n\n` +
                        `Namespace: ${this.#settings.namespace}\n` +
                        `Lost Keys amount: ${this.#queuedKeys.length} §r${date()}\n\n\n\n`
                    );
                }
            });
        });
    }

    #load(key: string): { canStr: boolean; inv: EntityInventoryComponent['container'] } {
        if (key.length > 30) throw new Error(`§cQIDB > Out of range: <${key}> has more than 30 characters §r${date()}`);
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
        const inv = entity.getComponent("minecraft:inventory")!.container;
        this.logs.load && console.log(`§aQIDB > Loaded entity <${key}> §r${date()}`);
        return { canStr, inv };
    }

    async #save(key: string, canStr: boolean): Promise<void> {
        if (canStr) world.structureManager.delete(key);
        world.structureManager.createFromWorld(key, this.#dimension, this.#sL, this.#sL, { saveMode: StructureSaveMode.World, includeEntities: true });
        const entities = this.#dimension.getEntities({ location: this.#sL, type: "qidb:storage" });
        entities.forEach(e => e.remove());
    }

    async #queueSaving(key: string, value: ItemStack | ItemStack[] | undefined): Promise<void> {
        this.#queuedKeys.push(key);
        this.#queuedValues.push(value);
    }

    async #romSave(key: string, value: ItemStack | ItemStack[] | undefined): Promise<void> {
        const { canStr, inv } = this.#load(key);
        if (!value) {
            for (let i = 0; i < 256; i++) inv.setItem(i, undefined);
            world.setDynamicProperty(key, null);
        }
        if (Array.isArray(value)) {
            try {
                for (let i = 0; i < 256; i++) inv.setItem(i, value[i] || undefined);
            } catch {
                throw new Error(`§cQIDB > Invalid value type. supported: ItemStack | ItemStack[] | undefined §r${date()}`);
            }
            world.setDynamicProperty(key, true);
        } else {
            try {
                inv.setItem(0, value);
                world.setDynamicProperty(key, false);
            } catch {
                throw new Error(`§cQIDB > Invalid value type. supported: ItemStack | ItemStack[] | undefined §r${date()}`);
            }
        }
        await this.#save(key, canStr);
    }

    set(key: string, value: ItemStack | ItemStack[]): void {
        if (!this.#validNamespace) throw new Error(`§cQIDB > Invalid name: <${this.#settings.namespace}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        if (!/^[A-Za-z0-9_]*$/.test(key)) throw new Error(`§cQIDB > Invalid name: <${key}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        const time = Date.now();
        key = `${this.#settings.namespace}:${key}`;
        if (Array.isArray(value)) {
            if (value.length > 255) throw new Error(`§cQIDB > Out of range: <${key}> has more than 255 ItemStacks §r${date()}`);
            world.setDynamicProperty(key, true);
        } else {
            world.setDynamicProperty(key, false);
        }
        this.#quickAccess.set(key, value);
        if (this.#queuedKeys.includes(key)) {
            const i = this.#queuedKeys.indexOf(key);
            this.#queuedValues.splice(i, 1);
            this.#queuedKeys.splice(i, 1);
        }
        this.#queueSaving(key, value);
        this.logs.set && console.log(`§aQIDB > Set key <${key}> succesfully. ${Date.now() - time}ms §r${date()}`);
    }

    get(key: string): ItemStack | ItemStack[] {
        if (!this.#validNamespace) throw new Error(`§cQIDB > Invalid name: <${this.#settings.namespace}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        if (!/^[A-Za-z0-9_]*$/.test(key)) throw new Error(`§cQIDB > Invalid name: <${key}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        const time = Date.now();
        key = `${this.#settings.namespace}:${key}`;
        if (this.#quickAccess.has(key)) {
            this.logs.get && console.log(`§aQIDB > Got key <${key}> succesfully. ${Date.now() - time}ms §r${date()}`);
            return this.#quickAccess.get(key)!;
        }
        const structure = world.structureManager.get(key);
        if (!structure) throw new Error(`§cQIDB > The key < ${key} > doesn't exist.`);
        const { canStr, inv } = this.#load(key);
        const items: (ItemStack | undefined)[] = [];
        for (let i = 0; i < 256; i++) items.push(inv.getItem(i));
        for (let i = 255; i >= 0; i--) if (!items[i]) items.pop(); else break;
        this.#save(key, canStr);
        this.logs.get && console.log(`§aQIDB > Got items from <${key}> succesfully. ${Date.now() - time}ms §r${date()}`);
        const result = world.getDynamicProperty(key) ? items : items[0];
        this.#quickAccess.set(key, result as ItemStack | ItemStack[]);
        return result as ItemStack | ItemStack[];
    }

    has(key: string): boolean {
        if (!this.#validNamespace) throw new Error(`§cQIDB > Invalid name: <${this.#settings.namespace}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        if (!/^[A-Za-z0-9_]*$/.test(key)) throw new Error(`§cQIDB > Invalid name: <${key}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        const time = Date.now();
        key = `${this.#settings.namespace}:${key}`;
        const exist = this.#quickAccess.has(key) || !!world.structureManager.get(key);
        this.logs.has && console.log(`§aQIDB > Found key <${key}> succesfully. ${Date.now() - time}ms §r${date()}`);
        return exist;
    }

    delete(key: string): void {
        if (!this.#validNamespace) throw new Error(`§cQIDB > Invalid name: <${this.#settings.namespace}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        if (!/^[A-Za-z0-9_]*$/.test(key)) throw new Error(`§cQIDB > Invalid name: <${key}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        const time = Date.now();
        key = `${this.#settings.namespace}:${key}`;
        if (this.#quickAccess.has(key)) this.#quickAccess.delete(key);
        const structure = world.structureManager.get(key);
        if (structure) {
            world.structureManager.delete(key);
            world.setDynamicProperty(key, null);
        } else {
            throw new Error(`§cQIDB > The key <${key}> doesn't exist. §r${date()}`);
        }
        this.logs.delete && console.log(`§aQIDB > Deleted key <${key}> succesfully. ${Date.now() - time}ms §r${date()}`);
    }

    keys(): string[] {
        if (!this.#validNamespace) throw new Error(`§cQIDB > Invalid name: <${this.#settings.namespace}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        const allIds = world.getDynamicPropertyIds();
        const ids = allIds
            .filter(id => id.startsWith(this.#settings.namespace + ":"))
            .map(id => id.replace(this.#settings.namespace + ":", ""));
        this.logs.keys && console.log(`§aQIDB > Got the list of all the ${ids.length} keys. §r${date()}`);
        return ids;
    }

    values(): (ItemStack | ItemStack[])[] {
        if (!this.#validNamespace) throw new Error(`§cQIDB > Invalid name: <${this.#settings.namespace}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        const time = Date.now();
        const allIds = world.getDynamicPropertyIds();
        const values: (ItemStack | ItemStack[])[] = [];
        const filtered = allIds
            .filter(id => id.startsWith(this.#settings.namespace + ":"))
            .map(id => id.replace(this.#settings.namespace + ":", ""));
        for (const key of filtered) {
            values.push(this.get(key));
        }
        this.logs.values && console.log(`§aQIDB > Got the list of all the ${values.length} values. ${Date.now() - time}ms §r${date()}`);
        return values;
    }

    clear(): void {
        if (!this.#validNamespace) throw new Error(`§cQIDB > Invalid name: <${this.#settings.namespace}>. accepted char: A-Z a-z 0-9 _ §r${date()}`);
        const time = Date.now();
        const allIds = world.getDynamicPropertyIds();
        const filtered = allIds
            .filter(id => id.startsWith(this.#settings.namespace + ":"))
            .map(id => id.replace(this.#settings.namespace + ":", ""));
        for (const key of filtered) {
            this.delete(key);
        }
        this.logs.clear && console.log(`§aQIDB > Cleared, deleted ${filtered.length} values. ${Date.now() - time}ms §r${date()}`);
    }
}