class MinecraftColors {
    constructor(private str: string) {}

    get grey(): string {
        return `§7${this.str}§r`;
    }

    get pink(): string {
        return `§d${this.str}§r`;
    }

    get blackGray(): string {
        return `§8${this.str}§r`;
    }

    get darkRed(): string {
        return `§4${this.str}§r`;
    }

    get darkGreen(): string {
        return `§2${this.str}§r`;
    }

    get darkBlue(): string {
        return `§1${this.str}§r`;
    }

    get darkYellow(): string {
        return `§6${this.str}§r`;
    }

    get red(): string {
        return `§c${this.str}§r`;
    }

    get green(): string {
        return `§a${this.str}§r`;
    }

    get blue(): string {
        return `§b${this.str}§r`;
    }

    get yellow(): string {
        return `§e${this.str}§r`;
    }

    get white(): string {
        return `§f${this.str}§r`;
    }

    get black(): string {
        return `§0${this.str}§r`;
    }

    get bold(): string {
        return `§l${this.str}§r`;
    }

    get italic(): string {
        return `§o${this.str}§r`;
    }

    get underline(): string {
        return `§n${this.str}§r`;
    }

    get strikethrough(): string {
        return `§m${this.str}§r`;
    }

    get obfuscated(): string {
        return `§k${this.str}§r`;
    }

    get reset(): string {
        return `§r${this.str}`;
    }
}

export { MinecraftColors };