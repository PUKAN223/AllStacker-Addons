export function getItemColorCode(amount: number) {
  if (amount >= 12960) return "§9";
  if (amount >= 2160) return "§b";
  if (amount >= 1080) return "§a";
  if (amount >= 108) return "§e";
  if (amount >= 77) return "§g";
  if (amount >= 66) return "§p";
  if (amount >= 36) return "§6";
  if (amount >= 18) return "§v";
  return "§c";
}