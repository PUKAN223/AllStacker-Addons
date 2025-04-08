export default function EntityToName(en) {
    return en.typeId.split(":")[1]
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
//# sourceMappingURL=EntityToName.js.map