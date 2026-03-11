export interface SpawnEggRegistry {
  animalType: string;
  grownTime: number;
  icon: string;
  drop: { type: string; amount: [number, number] }[];
}
