import { PluginBase } from "@axeth/api";

interface ArrestData {
  [policeId: string]: {
    robberId: string;
  };
}

class PoliceArrestDataManager {
  private plugin: PluginBase;

  private constructor(plugin: PluginBase) {
    this.plugin = plugin;
  }

  static initialize(plugin: PluginBase): PoliceArrestDataManager {
    return new PoliceArrestDataManager(plugin);
  }

  get data(): ArrestData {
    return JSON.parse(
      (this.plugin.config.get()["arrestData"]!.value as string) || "{}",
    ) as ArrestData;
  }

  public getArrestData(plId: string): ArrestData[string] | null {
    const data = this.data;
    if (data[plId]) {
      return data[plId];
    } else return null;
  }

  public setArrestData(plId: string, robberId: string): void {
    const data = this.data;
    data[plId] = { robberId };
    this.updateConfig(data);
  }

  public removeArrestData(plId: string): void {
    const data = this.data;
    delete data[plId];
    this.updateConfig(data);
  }

  private updateConfig(data: ArrestData): void {
    const config = this.plugin.config.get();
    config["arrestData"]!.value = JSON.stringify(data);
    this.plugin.config.set(config);
  }
}

export { PoliceArrestDataManager };
