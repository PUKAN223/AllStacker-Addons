import { PluginBase } from "@axeth/api";
import { Player, type Vector3 } from "@minecraft/server";

export interface DeathData {
    [playerId: string]: {
        deathTick: number;
        location: Vector3;
        reviveData: {
            reviving: boolean;
            reviveState: number;
            reviver: string | null;
        }
        lastNotifiedTick: number;
    }
}

class PlayerDiedDataManager {
    private plugin: PluginBase;
    private constructor(plugin: PluginBase) {
        this.plugin = plugin;
    }

    static initialize(plugin: PluginBase): PlayerDiedDataManager {
        return new PlayerDiedDataManager(plugin);
    }

    get data() {
        return JSON.parse(this.plugin.config.get()["deathData"]!.value as string) as DeathData;
    }

    public isPlayerInDeathState(playerId: string): boolean {
        const deathData = this.data;
        return deathData[playerId] !== undefined;
    }

    public setPlayerDeathData(playerId: string, deathInfo: DeathData[string]): void {
        const deathData = this.data;
        deathData[playerId] = deathInfo;
        this.updateDeathData(deathData);
    }

    public clearPlayerDeathData(playerId: string): void {
        const deathData = this.data;
        delete deathData[playerId];
        this.updateDeathData(deathData);
    }

    public getPlayerDeathData(player: Player): DeathData[string] | null {
        const deathData = this.data;
        return deathData[player.id] || null;
    }

    public updateDeathData(deathData: DeathData): void {
        const config = this.plugin.config.get();
        config["deathData"]!.value = JSON.stringify(deathData);
        this.plugin.config.set(config);
    }
}

export { PlayerDiedDataManager }