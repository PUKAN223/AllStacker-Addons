export interface ConfigOptions {
    format_version: number;
    meta: {
        name: string;
        icon: string;
        version: [number, number, number];
        description: string;
        seed: number,
        authors: string[];
    },
    filters: [
        {
            name: string;
            config: Record<string, string | number | boolean>;
        }
    ],
    env: Record<string, string>;
}