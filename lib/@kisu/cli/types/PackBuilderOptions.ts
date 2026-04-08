import { ConfigOptions } from "./ConfigOptions.ts";

export interface PackBuilderOptions {
    packsPath?: string;
    distPath?: string;
    name: string
    config: ConfigOptions;
}