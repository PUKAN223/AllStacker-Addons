import { MinecraftColors } from "../class/MinecraftColors.ts";

declare global {
  interface String {
    mcColors(): MinecraftColors;
  }
}

String.prototype.mcColors = function (): MinecraftColors {
  return new MinecraftColors(this.toString());
};
