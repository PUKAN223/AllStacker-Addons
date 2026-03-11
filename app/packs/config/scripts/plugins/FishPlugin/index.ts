import { PluginBase, type PluginSettingOptions } from "@axeth/api";
import { FishSystemManagers } from "./class/FishSystemManager.ts";
import { Player } from "@minecraft/server";


export class FishPlugin extends PluginBase {
    public override name: string = "FishPlugin";
    public override version: string = "1.0.0";
    public override icon: string = "textures/items/tools/fishing_rod";

    private fishSystemManagers = FishSystemManagers.initialize(this);

    public override onLoad(): void {
        this.fishSystemManagers.registerBar("", (index, _rand) => {
            if (index >= -4 && index <= 2) return true;
            if (index <= 25 && index >= 20) return true;
            return false;
        })

        this.fishSystemManagers.registerBar("", (index, rand) => {
            if (index >= -4 && index <= 4) return true;
            if (index >= -12 && index <= 12) return rand <= 60;
            if (index >= -20 && index <= 20) return rand <= 40;
            return false;
        })

        this.events.on("BeforeItemUse", (ev) => {
            this.fishSystemManagers.handleBeforeUseRod(ev);
        })

        this.events.on("AfterItemStopUse", (ev) => {
            this.fishSystemManagers.handleAfterStopUseRod(ev);
        })

        this.events.on("AfterTick", (ev) => {
            this.fishSystemManagers.handleTick(ev.currentTick);
        })

        this.events.on("AfterPlayerButtonInput", (ev) => {
            this.fishSystemManagers.handlePlayerButtonInput(ev);
        })
    }

    public override getAdvancedSettings(pl: Player, _plugin: PluginBase): (() => void) | null {
        return () => {
            this.fishSystemManagers.showFishingAdvancedSettings(pl)
        };
    }

    public override getSettings(): PluginSettingOptions {
      return {
        "fishingLoot": {
            canUserModify: false,
            default: "[]",
            description: "JSON array of fishing loot items",
            type: "string"
        }
      }
    }
}