import { Player, StartupEvent, ItemComponentUseEvent, PlayerPermissionLevel } from "@minecraft/server";
import { PluginBase, EventHandlers, SystemBase, WorldEvents } from "@axeth/api";
import { onPlayerJoin } from "./handlers/onPlayerJoin.ts";
import { showMainMenu } from "./ui/MainMenu.ts";

import { initTranslations } from "./lang/translations.ts";

export class ConfigMenuPlugin extends PluginBase {
  public override name = "ConfigMenu";
  public override version = "1.0.0";
  public override icon = "textures/ui/icon_setting";

  constructor(events: EventHandlers<WorldEvents>, systemBase: SystemBase) {
    super(events, systemBase);
  }

  public override onLoad(): void {
    initTranslations();
    this.events.on("AfterPlayerSpawn", (ev) => onPlayerJoin(ev, this));
  }

  public override onEnable(ev: StartupEvent): void {
    ev.itemComponentRegistry.registerCustomComponent("kisu:show_config", {
      onUse: (evUse: ItemComponentUseEvent) => {
        if (evUse.source.playerPermissionLevel === PlayerPermissionLevel.Operator) {
          showMainMenu(evUse.source as Player, this);
        } else {
          (evUse.source as Player).onScreenDisplay.setActionBar("§7You must be an Operator (OP) to use settings");
        }
      },
    });

    this.logger.info("ConfigMenu enabled.");
  }

  public override getSettings() {
    return {};
  }
}
