import { PlayerUtils, SystemBase } from "@axeth/api";
import { FarmSystem } from "./plugins/FarmPlugin/index.ts";
import { WalletPlugin } from "./plugins/WalletPlugin/index.ts";
import { FishPlugin } from "./plugins/FishPlugin/index.ts";
import { RevivePlayer } from "./plugins/RevivePlugin/index.ts";
import { RenamePlugin } from "./plugins/RenamePlugin/index.ts";
import { PlayerActionPlugin } from "./plugins/PlayerActionPlugin/index.ts";
import { CarryPlugin } from "./plugins/CarryPlugin/index.ts";
import { PolicePlugin } from "./plugins/PolicePlugin/index.ts";
import { RobberPlugin } from "./plugins/RobberPlugin/index.ts";
import { CarSpawnPlugin } from "./plugins/CarSpawnPlugin/index.ts";
import { PhonePlugin } from "./plugins/PhonePlugin/index.ts";
import { AntiFarmPlugin } from "./plugins/AntiFarmPlugin/index.ts";
import { TagManagerPlugin } from "./plugins/TagManagerPlugin/index.ts";
import { AnimalFarmPlugin } from "./plugins/AnimalFarmPlugin/index.ts";
import { StarterItemPlugin } from "./plugins/StarterItemPlugin/index.ts";
import { TickingPlugin } from "./plugins/TickingPlugin/index.ts";
import { MarketPlugin } from "./plugins/ShopSellPlugin/index.ts";
import { VehiclePlugin } from "./plugins/VehiclePlugin/index.ts";
import { CookingPlugin } from "./plugins/CookingPlugin/index.ts";
// import { AntiBlockPlugin } from "./plugins/AntiBlockPlugin/index.ts";

const plugins = [
  // AntiBlockPlug
  CookingPlugin,
  VehiclePlugin,
  MarketPlugin,
  AnimalFarmPlugin,
  StarterItemPlugin,
  TagManagerPlugin,
  CarSpawnPlugin,
  PolicePlugin,
  RevivePlayer,
  FishPlugin,
  FarmSystem,
  WalletPlugin,
  RenamePlugin,
  PlayerActionPlugin,
  CarryPlugin,
  RobberPlugin,
  PhonePlugin,
  AntiFarmPlugin,
  TickingPlugin,
];

class AxethAPI extends SystemBase {
  public override onLoad(): void {
    for (const plugin of plugins) {
      this.pluginManagers.registerPlugin(plugin);
    }

    const runId = this.system.runInterval(() => {
      for (const pl of this.world.getPlayers()) {
        PlayerUtils.stopBottomBar(pl);
        PlayerUtils.stopTopbar(pl);
      }
      this.system.clearRun(runId);
    }, 20);
  }
}

new AxethAPI();
