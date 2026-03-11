import type { StartupEvent } from "@minecraft/server";
import { PluginBase } from "../../class/PluginBase.ts";
import {
  CommandPermissionLevel,
  CustomCommandParamType,
  CustomCommandStatus,
} from "@minecraft/server";
import { Player } from "@minecraft/server";

class SystemPlugin extends PluginBase {
  public override isRuntime: boolean = true;

  public override onEnable(ev: StartupEvent): void {
    ev.customCommandRegistry.registerEnum("kisu:plugin_enums", [
      "list",
      "settings",
    ]);
    ev.customCommandRegistry.registerCommand(
      {
        name: "kisu:plugins",
        description: "Manage plugins and their settings.",
        permissionLevel: CommandPermissionLevel.Admin,
        cheatsRequired: false,
        mandatoryParameters: [
          {
            name: "kisu:plugin_enums",
            type: CustomCommandParamType.Enum,
          },
        ],
      },
      (origin, args) => {
        const player = origin.sourceEntity as Player;
        if (!(player instanceof Player))
          return {
            message: "Source must be a player",
            status: CustomCommandStatus.Failure,
          };
        if (args === "list") {
          const plugins = this.systemBase.pluginManagers.getPlugins();
          return {
            message: ` §a[Plugins List]§r\n${plugins.map((p) => ` §e- ${p.getName()} §7(v${p.version})`).join("\n")}`,
            status: CustomCommandStatus.Success,
          };
        } else if (args === "settings") {
          this.system.run(() => {
            this.systemBase.settingMenuBuilders.settingMenu(
              player,
              this.systemBase.pluginManagers,
            );
          });
          return { status: CustomCommandStatus.Success };
        }
        return { message: "404", status: CustomCommandStatus.Failure };
      },
    );
  }
  public override onLoad(): void {}
}

export { SystemPlugin };
