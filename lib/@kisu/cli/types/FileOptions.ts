export interface FileOptions {
    name: string;
    path: string;
    meta?: Record<string, unknown>;
    content?: string | Uint8Array;
}
//