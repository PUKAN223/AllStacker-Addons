import { PluginBase } from "@axeth/api";
import type { CookingData } from "../types/CookingData.ts";

class CookingDataManager {
  private plugin: PluginBase;

  constructor(plugin: PluginBase) {
    this.plugin = plugin;
  }

  get data() {
    return JSON.parse(
      this.plugin.config.get()["cookingData"]!.value as string,
    ) as CookingData;
  }

  public addCookingData(cookingId: string, cookingData: CookingData[string]) {
    const currentData = this.data;
    currentData[cookingId] = cookingData;
    this.updateCookingData(currentData);
  }

  public isHasCookingData(cookingId: string) {
    return !!this.data[cookingId];
  }

  public removeCookingData(cookingId: string) {
    const currentData = this.data;
    delete currentData[cookingId];
    this.updateCookingData(currentData);
  }

  public getCookingData(cookingId: string) {
    return this.data[cookingId];
  }

  public getAllCookingData() {
    return this.data;
  }

  public editCookingData(
    cookingId: string,
    newCookingData: Partial<CookingData[string]>,
  ) {
    const currentData = this.data;
    currentData[cookingId] = { ...currentData[cookingId], ...newCookingData } as CookingData[string];
    this.updateCookingData(currentData);
  }

  public updateCookingData(newData: CookingData) {
    const config = this.plugin.config.get();
    config["cookingData"]!.value = JSON.stringify(newData);
    this.plugin.config.set(config);
  }
}

//

export { CookingDataManager };
