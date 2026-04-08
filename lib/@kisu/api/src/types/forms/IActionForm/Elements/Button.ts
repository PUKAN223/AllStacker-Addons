import { RawText } from "npm:@minecraft/server@2.3.0";

export type IActionFormButton = {
    label: RawText | string;
    icon?: string;
    onClick?: () => void;
}