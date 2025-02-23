export default function getSizeStack(current: number, amount: number, maxStack: number) {
  const remaining = amount - current;
  return [...Array(Math.floor(remaining / maxStack)).fill(maxStack), remaining % maxStack].filter(Boolean);
}