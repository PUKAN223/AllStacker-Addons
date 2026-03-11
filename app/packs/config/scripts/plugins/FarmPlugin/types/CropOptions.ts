import type { Range } from "./Range.ts";

export enum CollectType {
    Cursor,
    RepeatHit
}

interface CropOptions {
    type: string;
    expireTicks: number;
    collectType: CollectType;
    growthTime: number;
    yieldAmount: number;
    name: string;
    collectDuration: number;
    icon: string;
    loot: { type: string; amount: Range }[];
    tool?: {
        name: string;
        texture: string;
        type: string
    }[]
}

export type { CropOptions }