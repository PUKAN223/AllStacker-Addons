import { Entity } from "@minecraft/server";

export default function getItemAmount(entity: Entity) {
  if (entity.isValid) return parseInt(entity.getTags().find(x => x.startsWith("amount:")).split(":")[1]) ?? entity.getComponent("item").itemStack.amount;
  return 1;
}