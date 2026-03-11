import { PluginBase, type PluginSettingOptions } from "@axeth/api";
import { Player } from "@minecraft/server";
import { PlayerCarryManager } from "./class/PlayerCarryManager.ts";

interface CustomPlayerCarryEvent {
    owner: Player;
    player: Player;
    isDeathState: boolean;
}

class CarryPlugin extends PluginBase {
    public override name: string = "CarryPlugin";
    public override version: string = "1.0.0";

    private playerCarryManager: PlayerCarryManager = PlayerCarryManager.initialize(this);


    public override onLoad(): void {
        this.events.on<"CustomPlayerCarryPlayer", CustomPlayerCarryEvent>("CustomPlayerCarryPlayer", (ev) => {
            const owner = ev.owner;
            const player = ev.player;
            if (ev.isDeathState) {
                this.playerCarryManager.startCarryingPlayer(owner, player, true);
                owner.dimension.playSound("random.pop", owner.location);
                return;
            }
            this.playerCarryManager.showRequestCarryUI(owner, player);
        });

        this.events.on("AfterTick", (ev) => {
            this.playerCarryManager.handleTick(ev);
        });
    }

    public override getSettings(): PluginSettingOptions {
        return {
            playerCarryData: {
                canUserModify: false,
                default: "{}",
                type: "string",
                description: "Data for all player carry states in the server.",
            }
        }
    }
}

export { CarryPlugin }