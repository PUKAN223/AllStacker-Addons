import type { Entity } from "@minecraft/server";
import type { IRenderingAdapter } from "../interfaces/IRenderingAdapter.ts";

/**
 * Renders stack count as an entity nameTag.
 * Supports the same %a / %n / %l format tokens as the old AllStacker code.
 */
export class NameTagRenderingAdapter implements IRenderingAdapter {
  constructor(private readonly baseFormat: string = "§7§c§l%a §r%n§r") {}

  updateDisplay(entity: Entity, amount: number, name: string): void {
    if (!entity.isValid) return;
    if (amount <= 1) {
      this.clearDisplay(entity);
      return;
    }
    let text = `§e ` + this.baseFormat;
    text = text.replace(/%a/g, `${getColorCode(amount)}x${amount}§r`);
    text = text.replace(/%n/g, name);
    text = text.replace(/%l/g, "\n");
    entity.nameTag = text;
  }

  clearDisplay(entity: Entity): void {
    if (!entity.isValid) return;
    entity.nameTag = "";
  }
}

/** Mirrors the old getItemColorCode / getMobColorCode logic. */
export function getColorCode(amount: number): string {
  if (amount >= 1290) return "§9";
  if (amount >= 960)  return "§b";
  if (amount >= 390)  return "§a";
  if (amount >= 108)  return "§e";
  if (amount >= 88)   return "§g";
  if (amount >= 68)   return "§p";
  if (amount >= 48)   return "§6";
  if (amount >= 18)   return "§v";
  return "§c";
}
