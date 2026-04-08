export interface PluginSettingOptions {
    [key: string]: {
        description: string;
        type: "string" | "number" | "boolean" | "array";
        default: string | number | boolean | (string | number | boolean)[];
        value?: string | number | boolean | (string | number | boolean)[];
        maxValue?: number;
        canUserModify?: boolean;
    }
}