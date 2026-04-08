import { GameMode, world } from "@minecraft/server";
import { Player } from "@minecraft/server";

class PlayerManagers {
    constructor() {}

    public eachPlayer(callback: (player: Player) => void) {
        const players = this.getAllPlayers();
        for (const player of players) {
            callback(player);
        }
    }

    public findPlayerByName(name: string): Player | null {
        const players = this.getAllPlayers();
        for (const player of players) {
            if (player.name === name) {
                return player;
            }
        }
        return null;
    }
    
    public countPlayers(): number {
        const players = this.getAllPlayers();
        return players.length;
    }

    public getAllPlayers(): Player[] {
        return world.getPlayers();
    }

    public isPlayerGameMode(player: Player, gameMode: GameMode): boolean {
        return player.getGameMode() === gameMode;
    }
}

export { PlayerManagers };