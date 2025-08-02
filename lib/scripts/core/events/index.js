import { system, world } from "@minecraft/server";
import { KXEvents } from "../class/EventEmitter";
export function initializeEvents() {
    const afterEvents = [];
    const beforeEvents = [];
    const systemBeforeEvents = [];
    const systemAfterEvents = [];
    for (const key in world.beforeEvents) {
        beforeEvents.push(key);
    }
    for (const key in world.afterEvents) {
        afterEvents.push(key);
    }
    for (const key in system.beforeEvents) {
        systemBeforeEvents.push(key);
    }
    for (const key in system.afterEvents) {
        systemAfterEvents.push(key);
    }
    afterEvents.forEach((event) => {
        world.afterEvents[event].subscribe((ev) => {
            KXEvents.emit(null, `after:${event}`, ev);
        });
    });
    beforeEvents.forEach((event) => {
        world.beforeEvents[event].subscribe((ev) => {
            KXEvents.emit(null, `before:${event}`, ev);
        });
    });
    systemAfterEvents.forEach((event) => {
        system.afterEvents[event].subscribe((ev) => {
            KXEvents.emit(null, `after:${event}`, ev);
        });
    });
    systemBeforeEvents.forEach((event) => {
        system.beforeEvents[event].subscribe((ev) => {
            KXEvents.emit(null, `before:${event}`, ev);
        });
    });
    system.runInterval(() => {
        KXEvents.emit(null, "after:tick", { currentTick: system.currentTick });
    });
}
//# sourceMappingURL=index.js.map