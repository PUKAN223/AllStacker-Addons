import { world } from "@minecraft/server";
let properties = {};
/*
  made by: pokecosimo123
*/
export class Database {
    constructor(name) {
        this.name = name;
        const getDatabases = world.getDynamicPropertyIds() || [];
        getDatabases.forEach((p) => {
            const split = p.split(":");
            if (split[0] === this.name) {
                if (!properties[this.name]) {
                    properties[this.name] = {
                        properties: [p]
                    };
                }
                else {
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
    set(property, value) {
        world.setDynamicProperty(`${this.name}:${property}`, JSON.stringify(value));
        if (properties[this.name].properties.find((c) => c.split(":")[1] === property))
            return;
        properties[this.name].properties.push(`${this.name}:${property}`);
    }
    get(property) {
        const value = world.getDynamicProperty(`${this.name}:${property}`);
        if (value === undefined)
            return undefined;
        return JSON.parse(value);
    }
    getAll(property) {
        if (world.getDynamicProperty(`${this.name}:${property}`) === undefined)
            return undefined;
        return properties[this.name];
    }
    delete(property) {
        const propExists = properties[this.name].properties.find((c) => c.split(":")[1] === property);
        if (propExists) {
            const index = properties[this.name].properties.indexOf(propExists);
            world.setDynamicProperty(properties[this.name].properties.find((c) => c.split(":")[1] === property));
            properties[this.name].properties.splice(index, 1);
        }
        else {
            console.warn('Property not found');
        }
    }
    clearAll() {
        const properties1 = properties[this.name].properties;
        properties1.forEach((p) => {
            world.getDynamicPropertyIds().forEach((d) => {
                if (p === d) {
                    world.setDynamicProperty(d);
                }
            });
        });
        properties[this.name].properties = [];
    }
    clearAllProperties() {
        properties = {};
        world.getDynamicPropertyIds().forEach((d) => {
            world.setDynamicProperty(d);
        });
    }
}
/*
  made by: pokecosimo123
*/ 
//# sourceMappingURL=Database.js.map