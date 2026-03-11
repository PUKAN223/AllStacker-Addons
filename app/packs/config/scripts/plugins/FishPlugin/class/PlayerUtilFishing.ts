import { ItemStack, Player, system } from "@minecraft/server";

class PlayerFishingUtils {

    private constructor() {}

    static initialize() {
        return new PlayerFishingUtils();
    }

    public stopSound(sound: string, pl: Player) {
        system.run(() => pl.runCommand(`stopsound @s ${sound}`))
    }

    public isUsedFishingRod(item: ItemStack, fishingRodTypeId: string): boolean {
        return item?.typeId === fishingRodTypeId;
    }
}

export { PlayerFishingUtils }