import { PluginBase } from "@axeth/api";
import type { AnimalData } from "../types/AnimalData.ts";

class AnimalDataManager {
  private plugin: PluginBase;

  constructor(plugin: PluginBase) {
    this.plugin = plugin;
  }

  get data() {
    return JSON.parse(
      this.plugin.config.get()["animalsData"]!.value as string,
    ) as AnimalData[];
  }

  private updateData(data: AnimalData[]) {
    const config = this.plugin.config.get();
    config["animalsData"]!.value = JSON.stringify(data);
    this.plugin.config.set(config);
  }

  public addAnimal(animal: AnimalData) {
    const data = this.data;
    data.push(animal);
    this.updateData(data);
  }

  public removeAnimal(id: string) {
    console.warn("Removeds");
    const data = this.data;
    const index = data.findIndex((animal) => animal.animalId === id);
    if (index !== -1) {
      data.splice(index, 1);
      this.updateData(data);
    }
  }

  public updateAnimal(id: string, updatedAnimal: AnimalData) {
    const data = this.data;
    const index = data.findIndex((animal) => animal.animalId === id);
    if (index !== -1) {
      data[index] = updatedAnimal;
      this.updateData(data);
    }
  }

  public getAnimal(id: string) {
    const data = this.data;
    const index = data.findIndex((animal) => animal.animalId === id);
    if (index !== -1) {
      return data[index];
    }
    return null;
  }

  public updateAnimalHealth(id: string, health: number) {
    const data = this.data;
    const index = data.findIndex((animal) => animal.animalId === id);
    if (index !== -1) {
      data[index]!.health = health;
      this.updateData(data);
    }
  }

  public getAnimals() {
    return this.data;
  }
}

export { AnimalDataManager };
