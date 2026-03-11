import { PluginBase, type PluginSettingOptions } from "@axeth/api";
import { RevivePlayerManagers } from "./class/RevivePlayerManagers.ts";

class RevivePlayer extends PluginBase {
    public override name: string = "RevivePlayer";
    public override version: string = "1.0.0";
    public override icon: string = "textures/ui/heart";

    private revivePlayerManagers = RevivePlayerManagers.initialize(this);

    private readonly tickPerSecond = 20;

    public override onLoad(): void {
        this.events.on("AfterEntityDie", (ev) => this.revivePlayerManagers.handlePlayerDied(ev));
        this.events.on("AfterPlayerSpawn", (ev) => this.revivePlayerManagers.handlePlayerSpawned(ev));
        this.events.on("AfterPlayerButtonInput", (ev) => this.revivePlayerManagers.handleButtonInput(ev));
        this.events.on("AfterTick", (ev) => {
            if (ev.currentTick % this.tickPerSecond === 0) {
                this.revivePlayerManagers.handleTick();
            }
        })
    }

    public override getSettings(): PluginSettingOptions {
        return {
            "deathData": {
                type: "string",
                canUserModify: false,
                default: "{}",
                description: "Stores data about players who have died."
            }
        }
    }
}

export { RevivePlayer }