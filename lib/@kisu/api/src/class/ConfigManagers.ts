import { world, World } from "npm:@minecraft/server@2.3.0";

class ConfigManagers {
    constructor() {

    }

    public getConfig<T = unknown>(name: string): Config<T> {
        return new Config<T>(name);
    }

    public clearAll() {
        const properties = world.getDynamicPropertyIds();
        for (const key in properties) {
            if (key.startsWith("config.")) {
                world.setDynamicProperty(key);
            }
        }
    }
}

class Config<T = unknown> {
    private name: string;
    private world: World;
    private prefix: string;

    constructor(name: string) {
        this.name = name;
        this.world = world;
        this.prefix = `config.${this.name}`;
    }

    set(value: T): void {
        this.world.setDynamicProperty(`${this.prefix}`, JSON.stringify(value));
    }

    get(): T {
        const value = this.world.getDynamicProperty(`${this.prefix}`) as string;
        if (!value) return {} as T;
        return JSON.parse(value) as T;
    }

    delete(): void {
        this.world.setDynamicProperty(`${this.prefix}`);
    }

    has(key: keyof T): boolean {
        const data = this.get();
        return data[key] !== undefined;
    }

    clear(): void {
        this.world.setDynamicProperty(`${this.prefix}`);
    }
}

export { ConfigManagers, Config };