import { PluginBase } from "@axeth/api";
import type { VehicleData } from "../types/VehicleData.ts";
import { Entity } from "@minecraft/server";

class VehicleDataManager {
  private plugin: PluginBase;

  constructor(plugin: PluginBase) {
    this.plugin = plugin;
  }

  get data() {
    return JSON.parse(
      this.plugin.config.get()["vehicleData"]!.value as string,
    ) as {
      [key: string]: VehicleData;
    };
  }

  public getVehicleId(en: Entity) {
    //vehicle:ownerName:typeId
    return en.getTags().find((x) => x.startsWith("vehicle:"));
  }

  public getVehicle(vehicleId: string): VehicleData | undefined {
    return this.data[vehicleId];
  }

  public addVehicle(vehicleId: string, vehicleData: VehicleData): void {
    const data = this.data;
    data[vehicleId] = vehicleData;
    this.updateData(data);
  }

  public editVehicle(
    vehicleId: string,
    vehicleData: Partial<VehicleData>,
  ): void {
    const data = this.data;
    const existingData = data[vehicleId];
    if (!existingData) return;

    const updatedData = { ...existingData, ...vehicleData };
    data[vehicleId] = updatedData;
    this.updateData(data);
  }

  public removeVehicle(vehicleId: string): void {
    const data = this.data;
    delete data[vehicleId];
    this.updateData(data);
  }

  public updateVehicle(vehicleId: string, vehicleData: VehicleData): void {
    const data = this.data;
    data[vehicleId] = vehicleData;
    this.updateData(data);
  }

  public clearData(): void {
    const data = this.data;
    Object.keys(data).forEach((key) => delete data[key]);
    this.updateData(data);
  }

  private updateData(data: { [key: string]: VehicleData }) {
    const config = this.plugin.config.get();
    config["vehicleData"]!.value = JSON.stringify(data);
    this.plugin.config.set(config);
  }
}

export { VehicleDataManager };
