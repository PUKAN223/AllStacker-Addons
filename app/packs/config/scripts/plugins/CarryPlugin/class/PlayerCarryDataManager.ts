import { PluginBase } from "@axeth/api";
import { Player } from "@minecraft/server";

interface PlayerCarryData {
  [ownerId: string]: {
    carriedPlayerId: string;
    isDeathState: boolean;
  };
}

class PlayerCarryDataManager {
  private plugin: PluginBase;

  private constructor(plugin: PluginBase) {
    this.plugin = plugin;
  }

  static initialize(plugin: PluginBase): PlayerCarryDataManager {
    return new PlayerCarryDataManager(plugin);
  }

  get data() {
    return JSON.parse(
      this.plugin.config.get()["playerCarryData"]!.value as string,
    ) as PlayerCarryData;
  }

  public getCarryData(owner: string) {
    const data = this.data;
    return data[owner] || null;
  }

  public getPlayerCarried(owner: string) {
    const carryData = this.getCarryData(owner);
    if (!carryData) return null;
    const carriedPlayerId = carryData.carriedPlayerId;
    const carriedPlayer =
      this.plugin.world.getPlayers().find((p) => p.id === carriedPlayerId) ||
      null;
    return carriedPlayer;
  }

  public hasCarryData(owner: string) {
    const data = this.data;
    return owner in data;
  }

  public getCarriesData() {
    return this.data;
  }

  public setCarryData(
    owner: Player,
    carriedPlayer: Player,
    isDeathState: boolean,
  ) {
    const data = this.data;
    data[owner.id] = {
      carriedPlayerId: carriedPlayer.id,
      isDeathState: isDeathState,
    };
    this.updateCarryData(data);
  }

  public clearCarryData(owner: string) {
    const data = this.data;
    delete data[owner];
    this.updateCarryData(data);
  }

  public updateCarryData(data: PlayerCarryData) {
    const config = this.plugin.config.get();
    config["playerCarryData"]!.value = JSON.stringify(data);
    this.plugin.config.set(config);
  }
}

export { PlayerCarryDataManager };
