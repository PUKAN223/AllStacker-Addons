import { Entity } from "@minecraft/server";

export default function EntityToName(en: Entity) {
  return en.typeId.split(":")[1]
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}