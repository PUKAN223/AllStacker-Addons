export function getItemColorCode(amount: number) {
  if (amount >= 1290) return "§9";
  if (amount >= 960) return "§b";
  if (amount >= 390) return "§a";
  if (amount >= 108) return "§e";
  if (amount >= 88) return "§g";
  if (amount >= 68) return "§p";
  if (amount >= 48) return "§6";
  if (amount >= 18) return "§v";
  return "§c";
}
