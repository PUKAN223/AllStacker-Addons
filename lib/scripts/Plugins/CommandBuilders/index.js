import { system } from "@minecraft/server";
import { commandLists } from "../../Class/CommandBuilders";
import CustomEvents from "../../Events/CustomEvent";
import Plugins from "../../Class/Plugins";
export default class CommandBuilder extends Plugins {
    constructor(name) {
        super(name);
        this.name = name;
    }
    setup() {
    }
    init() {
        new CustomEvents(this.name).onChatSend((ev) => {
            if (ev.message.slice(1, ev.message.length) == "help") {
                ev.sender.sendMessage(`${commandLists.map(x => `§c${x.prefix}§7${x.name} §r§c- §7${x.description}§r`).join("\n")}`);
                ev.cancel = true;
            }
            else if (commandLists.some(x => `${x.prefix}${x.name}` == ev.message)) {
                const command = commandLists.find(x => `${x.prefix}${x.name}` == ev.message);
                system.run(() => {
                    if (command.permission(ev.sender)) {
                        command.callback(ev.sender);
                    }
                    else {
                        ev.sender.sendMessage(`§cYou dont have permission to use this command.`);
                    }
                });
                ev.cancel = true;
            }
        });
    }
}
//# sourceMappingURL=index.js.map