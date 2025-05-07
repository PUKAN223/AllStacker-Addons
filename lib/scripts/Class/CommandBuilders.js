export const commandLists = [];
export default class CommandBuilder {
    constructor(name, description, prefix, permission) {
        this.name = name;
        this.description = description;
        this.permission = permission;
        this.prefix = prefix;
    }
    overload(callback) {
        commandLists.push({
            name: this.name,
            description: this.description,
            permission: this.permission,
            callback: callback,
            prefix: this.prefix
        });
    }
}
//# sourceMappingURL=CommandBuilders.js.map