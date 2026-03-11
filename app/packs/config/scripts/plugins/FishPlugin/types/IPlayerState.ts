import { Entity, type Vector3 } from "@minecraft/server";

export interface IPlayerState {
    rodStartTick: number;
    isCasted: boolean;
    hookEntity?: Entity;
    reelActive: boolean;
    castedRotation?: Vector3;
    // Fishing state
    reelStartTick: number;
    reelAmount: number;
    completedReelParts: number;
    lineDurability: number;
    hasFishPulling: boolean;
    fishWillPullTick: number;
    fishEscapeTick: number;
    reelStuckAddPlayedTick: number;
    reelInAddPlayedTick: number;
    startFishSlot?: number
}