import type { SpawnEggRegistry } from "./SpawnEggRegistry.ts";

interface AnimalData {
  info: SpawnEggRegistry;
  ownerName: string;
  ownerId: string;
  animalId: string;
  animalName: string;
  animalType: string;
  spawnTime: number;
  health: number;
}

export type { AnimalData };
