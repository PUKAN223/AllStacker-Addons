import { IActionForm, IModalForm, PluginBase, type PluginSettingOptions } from "@axeth/api";
import { BlockInventoryComponent, Player } from "@minecraft/server";

const BLOCKED_BLOCKS_KEY = "blockedContainerBlocks";
const ALLOW_INTERACTION_KEY = "allowContainerInteraction";

class AntiBlockPlugin extends PluginBase {
    public override name: string = "AntiBlockPlugin";
    public override version: string = "1.0.0"
    public override icon: string = "textures/blocks/barrier"

    public override onLoad(): void {
        this.events.on("BeforePlayerInteractWithBlock", (ev) => {
            if (this.getAllowContainerInteraction()) return;

            const hasContainer = ev.block.getComponent(BlockInventoryComponent.componentId);
            if (!hasContainer) return;

            const blockedBlocks = this.getBlockedBlocks();
            if (blockedBlocks.length > 0 && !blockedBlocks.includes(ev.block.typeId)) {
                return;
            }

            ev.cancel = true;
        })
    }

    public override getAdvancedSettings(pl: Player, _plugin: PluginBase): (() => void) | null {
        return () => this.openAdvancedMenu(pl);
    }

    public override getSettings(): PluginSettingOptions {
        return {
            [ALLOW_INTERACTION_KEY]: {
                canUserModify: false,
                description: "Allow players to interact with container blocks.",
                type: "boolean",
                default: false,
            },
            [BLOCKED_BLOCKS_KEY]: {
                canUserModify: false,
                description: "Specific container block ids to block. Empty means block all container blocks.",
                type: "array",
                default: [],
            },
        }
    }

    private openAdvancedMenu(pl: Player): void {
        const blockedBlocks = this.getBlockedBlocks();
        const modeText = this.getAllowContainerInteraction() ? "ON" : "OFF";
        const scopeText = blockedBlocks.length > 0 ? `${blockedBlocks.length} specific blocks` : "all container blocks";

        const ui = IActionForm.createForm(
            "AntiBlockPlugin Settings",
            `Allow interaction: ${modeText}\nBlocking scope: ${scopeText}`,
        );

        ui.addButton("View blocked blocks", "textures/blocks/barrier", () => {
            this.showBlockedBlocks(pl);
        });
        ui.addButton("Add blocked block", "textures/ui/add", () => {
            this.showAddBlockedBlockForm(pl);
        });
        ui.addButton("Remove blocked block", "textures/ui/cancel", () => {
            this.showRemoveBlockedBlockMenu(pl);
        });
        ui.addButton(`Toggle allow interaction (${modeText})`, "textures/ui/icon_setting", () => {
            this.setAllowContainerInteraction(!this.getAllowContainerInteraction());
            this.openAdvancedMenu(pl);
        });
        ui.addButton("Close", "textures/ui/cancel");

        ui.show(pl).catch(() => {});
    }

    private showBlockedBlocks(pl: Player): void {
        const blockedBlocks = this.getBlockedBlocks();
        const body = blockedBlocks.length > 0
            ? blockedBlocks.map((id, index) => `${index + 1}. ${id}`).join("\n")
            : "No specific blocks in list.\nCurrently all container blocks are blocked.";

        const ui = IActionForm.createForm("Blocked Container Blocks", body, () => {
            this.openAdvancedMenu(pl);
        });
        ui.addButton("Back", "textures/ui/arrow_left", () => this.openAdvancedMenu(pl));
        ui.show(pl).catch(() => {});
    }

    private showAddBlockedBlockForm(pl: Player): void {
        const form = IModalForm.createForm("Add Block", "Save");
        form.addTextField(
            {
                label: "Block ID",
                placeholderText: "minecraft:chest",
                defaultValue: "",
                tooltip: "Example: minecraft:chest",
            },
            () => { },
        );

        form.show(pl).then((res) => {
            if (!res || res.canceled) {
                this.openAdvancedMenu(pl);
                return;
            }

            const value = String(res.formValues?.[0] ?? "").trim().toLowerCase();
            if (!value.includes(":")) {
                pl.sendMessage("§cInvalid block id. Use namespace format like minecraft:chest.");
                this.openAdvancedMenu(pl);
                return;
            }

            const blockedBlocks = this.getBlockedBlocks();
            if (!blockedBlocks.includes(value)) {
                blockedBlocks.push(value);
                this.setBlockedBlocks(blockedBlocks);
                pl.sendMessage(`§aAdded blocked block: §e${value}`);
            } else {
                pl.sendMessage(`§eBlock already exists in list: ${value}`);
            }

            this.openAdvancedMenu(pl);
        }).catch(() => {
            this.openAdvancedMenu(pl);
        });
    }

    private showRemoveBlockedBlockMenu(pl: Player): void {
        const blockedBlocks = this.getBlockedBlocks();
        if (blockedBlocks.length === 0) {
            pl.sendMessage("§eNo specific blocked blocks to remove.");
            this.openAdvancedMenu(pl);
            return;
        }

        const ui = IActionForm.createForm(
            "Remove Block",
            "Select a block to remove from blocked list.",
            () => this.openAdvancedMenu(pl),
        );

        for (const blockId of blockedBlocks) {
            ui.addButton(blockId, "textures/ui/cancel", () => {
                const nextBlocks = this.getBlockedBlocks().filter((id) => id !== blockId);
                this.setBlockedBlocks(nextBlocks);
                pl.sendMessage(`§aRemoved blocked block: §e${blockId}`);
                this.showRemoveBlockedBlockMenu(pl);
            });
        }

        ui.addButton("Back", "textures/ui/arrow_left", () => this.openAdvancedMenu(pl));
        ui.show(pl).catch(() => {});
    }

    private getAllowContainerInteraction(): boolean {
        const config = this.config.get();
        return Boolean(config[ALLOW_INTERACTION_KEY]?.value ?? config[ALLOW_INTERACTION_KEY]?.default ?? false);
    }

    private setAllowContainerInteraction(value: boolean): void {
        const config = this.config.get();
        const setting = this.getPluginSettings()[ALLOW_INTERACTION_KEY]!;
        config[ALLOW_INTERACTION_KEY] = {
            ...setting,
            value,
        };
        this.config.set(config);
    }

    private getBlockedBlocks(): string[] {
        const config = this.config.get();
        const raw = config[BLOCKED_BLOCKS_KEY]?.value ?? config[BLOCKED_BLOCKS_KEY]?.default ?? [];
        if (!Array.isArray(raw)) return [];
        return raw.map((v) => String(v).trim().toLowerCase()).filter((v) => v.length > 0);
    }

    private setBlockedBlocks(blockIds: string[]): void {
        const config = this.config.get();
        const setting = this.getPluginSettings()[BLOCKED_BLOCKS_KEY]!;
        config[BLOCKED_BLOCKS_KEY] = {
            ...setting,
            value: [...new Set(blockIds)],
        };
        this.config.set(config);
    }
}

export { AntiBlockPlugin };
