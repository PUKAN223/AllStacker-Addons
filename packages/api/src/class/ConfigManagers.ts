import { world, type World } from "@minecraft/server";

class ConfigManagers {
    /** Keyed by plugin name — ensures the same Config instance (and its cache) is reused. */
    private readonly _configs = new Map<string, Config<unknown>>();

    constructor() {}

    public getConfig<T = unknown>(name: string): Config<T> {
        if (!this._configs.has(name)) {
            this._configs.set(name, new Config<T>(name));
        }
        return this._configs.get(name) as Config<T>;
    }

    public clearAll() {
        const properties = world.getDynamicPropertyIds();
        for (const key of properties) {
            if (key.startsWith("config.")) {
                world.setDynamicProperty(key);
            } 
        }
        // Invalidate all cached Config instances.
        this._configs.clear();
    }
}

class Config<T = unknown> {
    private name: string;
    private world: World;
    private prefix: string;
    private readonly maxChunkSize = 32767;
    /** In-memory cache — eliminates repeated getDynamicPropertyIds() + JSON.parse per tick. */
    private _cache: T | undefined = undefined;

    constructor(name: string) {
        this.name = name;
        this.world = world;
        this.prefix = `config.${this.name}`;
    }

    set(value: T): void {
        const serialized = JSON.stringify(value);

        // Invalidate cache before writing.
        this._cache = undefined;

        // Clear existing chunks before writing the new value
        this.clear();

        if (serialized.length <= this.maxChunkSize) {
            this.world.setDynamicProperty(this.prefix, serialized);
            this._cache = value; // re-populate after write
            return;
        }

        let partIndex = 0;
        for (let offset = 0; offset < serialized.length; offset += this.maxChunkSize) {
            const chunk = serialized.slice(offset, offset + this.maxChunkSize);
            this.world.setDynamicProperty(`${this.prefix}.part${partIndex}`, chunk);
            partIndex++;
        }
        // For chunked data, re-populate cache from the original value.
        this._cache = value;
    }

    get(): T {
        // Return cached value if available — avoids world API and JSON.parse.
        if (this._cache !== undefined) return this._cache;

        const partPrefix = `${this.prefix}.part`;
        const partKeys = this.world
            .getDynamicPropertyIds()
            .filter((id) => id.startsWith(partPrefix))
            .sort((a, b) => {
                const aIndex = Number(a.slice(partPrefix.length));
                const bIndex = Number(b.slice(partPrefix.length));
                return aIndex - bIndex;
            });

        let raw = this.world.getDynamicProperty(this.prefix) as string | undefined;

        if (partKeys.length > 0) {
            const parts: string[] = [];
            for (const key of partKeys) {
                const chunk = this.world.getDynamicProperty(key) as string | undefined;
                if (chunk) parts.push(chunk);
            }
            raw = parts.join("");
        }

        if (!raw) {
            this._cache = {} as T;
            return this._cache;
        }
        this._cache = JSON.parse(raw) as T;
        return this._cache;
    }

    delete(): void {
        this.clear();
    }

    has(key: keyof T): boolean {
        const data = this.get();
        return data[key] !== undefined;
    }

    clear(): void {
        // Invalidate cache.
        this._cache = undefined;

        const partPrefix = `${this.prefix}.part`;
        const keys = this.world
            .getDynamicPropertyIds()
            .filter((id) => id === this.prefix || id.startsWith(partPrefix));

        for (const key of keys) {
            this.world.setDynamicProperty(key);
        }
    }
}

export { ConfigManagers, Config };