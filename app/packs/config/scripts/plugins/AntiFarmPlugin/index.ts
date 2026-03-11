import { PluginBase } from "@axeth/api";
import { Player } from "@minecraft/server";

class AntiFarmPlugin extends PluginBase {
    public override name: string = "AntiFarmPlugin";
    public override version: string = "1.0.0";
    public override icon: string = "textures/items/wheat"

    public override onLoad(): void {
        this.events.on("AfterTick", ({ currentTick }) => {
            if (currentTick % 2 !== 0) return;
            for (const player of this.world.getPlayers()) {
                if (this.isNearFarmLand(player)) {
                    player.addEffect("minecraft:slow_falling", 20, {
                        showParticles: false,
                        amplifier: 255
                    });
                }
            }
        })
    }

    private isNearFarmLand(player: Player, radius: number = 3): boolean {
        const playerPos = player.location;

        for (let x = -radius; x <= radius; x++) {
            for (let z = -radius; z <= radius; z++) {
                for (let y = -radius; y <= 0; y++) {
                    const block = player.dimension.getBlock({ x: playerPos.x + x, y: playerPos.y + y, z: playerPos.z + z });
                    if (block && block.typeId === "minecraft:farmland") {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

export { AntiFarmPlugin };