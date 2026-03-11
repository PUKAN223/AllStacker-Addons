import { PluginBase } from "@axeth/api";
import { InputButton } from "@minecraft/server";

class TickingPlugin extends PluginBase {
  public override name: string = "MinimapPlugin";
  public override version: string = "1.0.0";

  public override onLoad(): void | Promise<void> {
    this.events.on("AfterPlayerButtonInput", (ev) => {
      if (ev.button === InputButton.Sneak) {
        ev.player.playAnimation("animation.taekung.clear");
      }
    });
    this.events.on("AfterTick", (ev) => {
      if (ev.currentTick % 20 == 0) this.handleTick();
    });

    this.events.on("AfterPlayerSpawn", (ev) => {
      if (ev.initialSpawn) {
        ev.player.playMusic("record.background", {
          loop: true,
          volume: 0.4,
        });
      }
    });
  }

  private handleTick() {
    const objs = this.getObjectives(["money", "rmoney", "ktcoin"]);

    for (const obj in objs) {
      const objective = objs[obj as keyof typeof objs];
      const players = this.world.getAllPlayers();
      players.forEach((player) => {
        if (!objective) return;
        objective.addScore(player, 0);
      });
    }
  }

  public getObjectives<T extends string>(
    objs: readonly T[],
  ): { [K in T]: ReturnType<typeof this.world.scoreboard.getObjective> } {
    const result = {} as {
      [K in T]: ReturnType<typeof this.world.scoreboard.getObjective>;
    };

    objs.forEach((obj) => {
      let objective = this.world.scoreboard.getObjective(obj);

      if (!objective) {
        objective = this.world.scoreboard.addObjective(obj, obj);
      }

      result[obj] = objective;
    });

    return result;
  }
}

export { TickingPlugin };
