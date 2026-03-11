import { PluginBase } from "@axeth/api";
import type { AnimalArea } from "../types/AnimalArea.ts";
import type { Vector3 } from "@minecraft/server";

class AnimalAreaManager {
  private plugin: PluginBase;

  constructor(plugin: PluginBase) {
    this.plugin = plugin;
  }

  get data() {
    return JSON.parse(
      this.plugin.config.get()["animalsArea"]!.value as string,
    ) as AnimalArea;
  }

  public addArea(id: string, area: AnimalArea[string]) {
    const data = this.data;
    data[id] = area;
    this.update(data);
  }

  public removeArea(id: string) {
    const data = this.data;
    delete data[id];
    this.update(data);
  }

  public editArea(id: string, area: AnimalArea[string]) {
    const data = this.data;
    data[id] = area;
    this.update(data);
  }

  public isInAnimalArea(location: Vector3) {
    for (const key in this.data) {
      const area = this.data[key]!;

      const minX = Math.min(area.start.x, area.end.x);
      const maxX = Math.max(area.start.x, area.end.x);
      const minY = Math.min(area.start.y, area.end.y);
      const maxY = Math.max(area.start.y, area.end.y);
      const minZ = Math.min(area.start.z, area.end.z);
      const maxZ = Math.max(area.start.z, area.end.z);

      if (
        location.x >= minX && location.x <= maxX &&
        location.y >= minY && location.y <= maxY &&
        location.z >= minZ && location.z <= maxZ
      ) return true;
    }

    return false;
  }

  public update(data: AnimalArea) {
    const config = this.plugin.config.get();
    config["animalsArea"]!.value = JSON.stringify(data);
    this.plugin.config.set(config);
  }
}

export { AnimalAreaManager };
