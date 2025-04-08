import { system } from "@minecraft/server";
export function getTimeRemaining(minutes, seconds, referenceTick) {
    const now = system.currentTick;
    const specifiedTimeTicks = (minutes * 60 + seconds) * 20;
    const targetTick = referenceTick + specifiedTimeTicks;
    let diffTicks = targetTick - now;
    const diffMinutes = Math.floor(diffTicks / (20 * 60));
    diffTicks -= diffMinutes * (20 * 60);
    const diffSeconds = Math.floor(diffTicks / 20);
    return { m: diffMinutes, s: diffSeconds };
}
//# sourceMappingURL=GetTimeRemianing.js.map