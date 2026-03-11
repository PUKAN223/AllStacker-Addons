import type { Vector3 } from "@minecraft/server";

interface AnimalArea {
  [key: string]: {
    start: Vector3;
    end: Vector3;
  };
}

export type { AnimalArea };
