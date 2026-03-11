import type { Vector3 } from "@minecraft/server";

interface CropSpawnerData {
    cropId: string;
    rangeLocation: {
        start: Vector3,
        end: Vector3
    },
    spawnInterval: number;
    maxCrops: number;
}

export type { CropSpawnerData }