export default function getSizeStack(current, amount, maxStack) {
    const remaining = amount - current;
    return [...Array(Math.floor(remaining / maxStack)).fill(maxStack), remaining % maxStack].filter(Boolean);
}
//# sourceMappingURL=GetSizeStack.js.map