import type { RawText } from "@minecraft/server";

export type IActionFormButton = {
    label: RawText | string;
    icon?: string;
    onClick?: () => void;
}