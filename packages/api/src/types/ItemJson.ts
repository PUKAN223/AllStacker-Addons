import { Enchantment } from "@minecraft/server";

export interface ItemJson {
  typeId: string;
  amount: number;
  keepOnDeath?: boolean;
  lockMode?: string;
  maxAmount?: number;
  nameTag?: string;
  dynamicProperty?: { id: string; data: unknown }[];
  lores?: string[];
  can_destroy?: string[];
  can_placeon?: string[];
  durability?: number;
  enchants?: Enchantment[]
}