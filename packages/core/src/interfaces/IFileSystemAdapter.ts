export interface IFileSystemAdapter {
  stat(path: string): Promise<{ mtimeMs: number; size: number } | null>;
  readFile(path: string): Promise<Uint8Array | string>;
  writeFile(path: string, content: Uint8Array | string): Promise<void>;
  copyFile(source: string, destination: string): Promise<void>;
  remove(path: string, options?: { recursive?: boolean }): Promise<void>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  readDir(path: string): AsyncIterable<{ name: string; isFile: boolean; isDirectory: boolean }>;
  rename(oldPath: string, newPath: string): Promise<void>;
}
