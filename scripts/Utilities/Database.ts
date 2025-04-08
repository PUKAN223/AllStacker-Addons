import { world, system } from "@minecraft/server";

// Define interfaces for type safety
interface DatabaseProperties {
    [key: string]: {
        properties: string[];
    };
}

let properties: DatabaseProperties = {};

/*
  made by: pokecosimo123
*/
export class Database {
    private name: string;

    constructor(name: string) {
        this.name = name;
        const getDatabases: string[] = world.getDynamicPropertyIds() || [];
        
        getDatabases.forEach((p: string) => {
            const split: string[] = p.split(":");
            if (split[0] === this.name) {
                if (!properties[this.name]) {
                    properties[this.name] = {
                        properties: [p]
                    };
                } else {
                    properties[this.name].properties.push(p);
                }
            }
        });

        if (!properties[this.name]) {
            properties[this.name] = {
                properties: []
            };
        }

        if (!properties[this.name].properties) {
            properties[this.name] = {
                properties: []
            };
        }
    }

    set(property: string, value: any): void {
        world.setDynamicProperty(`${this.name}:${property}`, JSON.stringify(value));
        if (properties[this.name].properties.find((c: string) => c.split(":")[1] === property)) return;
        properties[this.name].properties.push(`${this.name}:${property}`);
    }

    get<T>(property: string): T | undefined {
        const value = world.getDynamicProperty(`${this.name}:${property}`);
        if (value === undefined) return undefined;
        return JSON.parse(value as string) as T;
    }

    getAll(property: string): DatabaseProperties[string] | undefined {
        if (world.getDynamicProperty(`${this.name}:${property}`) === undefined) return undefined;
        return properties[this.name];
    }

    delete(property: string): void {
        const propExists = properties[this.name].properties.find((c: string) => c.split(":")[1] === property);
        if (propExists) {
            const index = properties[this.name].properties.indexOf(propExists);
            world.setDynamicProperty(properties[this.name].properties.find((c: string) => c.split(":")[1] === property));
            properties[this.name].properties.splice(index, 1);
        } else {
            console.warn('Property not found');
        }
    }

    clearAll(): void {
        const properties1: string[] = properties[this.name].properties;
        properties1.forEach((p: string) => {
            world.getDynamicPropertyIds().forEach((d: string) => {
                if (p === d) {
                    world.setDynamicProperty(d);
                }
            });
        });
        properties[this.name].properties = [];
    }

    clearAllProperties(): void {
        properties = {};
        world.getDynamicPropertyIds().forEach((d: string) => {
            world.setDynamicProperty(d);
        });
    }
}

/*
  made by: pokecosimo123
*/