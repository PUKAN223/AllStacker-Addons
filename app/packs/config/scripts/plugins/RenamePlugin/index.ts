import { PluginBase } from "@axeth/api";
import { CommandPermissionLevel, StartupEvent, CustomCommandStatus, CustomCommandParamType, Player, Entity } from "@minecraft/server";

class RenamePlugin extends PluginBase {
    public override name: string = "RenamePlugin";
    public override version: string = "1.0.0"
    public override icon: string = "textures/items/name_tag";

    public override onLoad(): void {
        // Your plugin logic here
    }

    public override onEnable(ev: StartupEvent): void {
        ev.customCommandRegistry.registerCommand({
            name: "kisu:rename",
            description: "Rename a player.",
            mandatoryParameters: [
                {
                    name: "players",
                    type: CustomCommandParamType.PlayerSelector
                },
                {
                    name: "newName",
                    type: CustomCommandParamType.String
                }
            ],
            permissionLevel: CommandPermissionLevel.Admin,
        }, (_origin, ...args) => {
            const players = args[0] as Entity[]
            this.system.run(() => {
                for (const entity of players) {
                    if (entity instanceof Player) {
                        entity.nameTag = args[1] as string; // Replace with desired name
                    }
                }
            })
            return { status: CustomCommandStatus.Success, message: `Rename ${players.length} players to ${args[1]}` };
        })
    }
}

export { RenamePlugin }