import { PluginBase } from "@axeth/api";
import type { CropSpawnerData } from "../types/CropSpawnerData.ts";
import type { Vector3 } from "@minecraft/server";

class CropSpawnerDataManager {
    private plugin: PluginBase;

    constructor(plugin: PluginBase) {
        this.plugin = plugin;
    }

    get data() {
        return JSON.parse(this.plugin.config.get()["farmCropsData"]!.value as string) as Record<string, CropSpawnerData>;
    }

    get size(): number {
        return Object.keys(this.data).length;
    }

    private startEndToKey(start: Vector3, end: Vector3): string {
        return `${start.x},${start.y},${start.z}-${end.x},${end.y},${end.z}`;
    }

    public getCropDataById(spawnId: string): CropSpawnerData | null {
        const data = this.data;
        const cropData = data[spawnId];
        return cropData || null;
    }

    public setCropData(spawnId: string, cropData: Partial<CropSpawnerData>): void {
        const currentData = this.data;
        currentData[spawnId] = {
            ...currentData[spawnId],
            ...cropData,
        } as CropSpawnerData;
        this.updateCropData(currentData);
        return;
    }

    public removeCropData(spawnId: string): Record<string, CropSpawnerData> {
        const currentData = this.data;
        delete currentData[spawnId];
        this.updateCropData(currentData);
        return currentData;
    }

    public getCropDataByRange(location: Vector3): { key: string, data: CropSpawnerData }[] | null {
        const data = this.data;
        const foundCrops: { key: string, data: CropSpawnerData }[] = [];
        for (const key in data) {
            const cropData = data[key]!;
            if (this.isInRange(location, cropData.rangeLocation.start, cropData.rangeLocation.end)) {
                foundCrops.push({ key, data: cropData });
            }
        }
        if (foundCrops.length > 0) return foundCrops;
        return null;
    }

    public addCropData(cropData: CropSpawnerData): Record<string, CropSpawnerData> {
        const currentData = this.data;
        const key = this.startEndToKey(cropData.rangeLocation.start, cropData.rangeLocation.end);
        currentData[key] = cropData;
        this.updateCropData(currentData);
        return currentData;
    }

    public updateCropData(data: Record<string, CropSpawnerData>): void {
        const config = this.plugin.config.get();
        config["farmCropsData"]!.value = JSON.stringify(data);
        this.plugin.config.set(config);
        return;
    }

    public isInRange(location: Vector3, start: Vector3, end: Vector3): boolean {
        return (
            location.x >= Math.min(start.x, end.x) && location.x <= Math.max(start.x, end.x) &&
            location.y >= Math.min(start.y, end.y) && location.y <= Math.max(start.y, end.y) &&
            location.z >= Math.min(start.z, end.z) && location.z <= Math.max(start.z, end.z)
        );
    }
}


export { CropSpawnerDataManager }