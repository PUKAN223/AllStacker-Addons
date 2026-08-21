import type { IFileSystemAdapter } from  "@packages/core/src/interfaces/IFileSystemAdapter.ts";

export interface FileOptions {
  name: string;
  path: string;
  meta?: Record<string, unknown>;
  content?: string | Uint8Array;
  fsAdapter?: IFileSystemAdapter;
}
//
