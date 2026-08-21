import type { IFileSystemAdapter } from  "@packages/core/src/interfaces/IFileSystemAdapter.ts";

export class DenoFileSystemAdapter implements IFileSystemAdapter {
  async stat(path: string): Promise<{ mtimeMs: number; size: number } | null> {
    try {
      const st = await Deno.stat(path);
      return { mtimeMs: st.mtime?.getTime() ?? 0, size: st.size };
    } catch {
      return null;
    }
  }

  async readFile(path: string): Promise<Uint8Array | string> {
    const extension = path.split(".").pop()?.toLowerCase();
    if (
      extension &&
      ["png", "jpg", "jpeg", "gif", "webp", "bmp", "zip", "mcaddon"].includes(
        extension,
      )
    ) {
      return await Deno.readFile(path);
    }
    return await Deno.readTextFile(path);
  }

  async writeFile(path: string, content: Uint8Array | string): Promise<void> {
    if (content instanceof Uint8Array) {
      await Deno.writeFile(path, content);
    } else {
      await Deno.writeTextFile(path, content);
    }
  }

  async copyFile(source: string, destination: string): Promise<void> {
    await Deno.copyFile(source, destination);
  }

  async remove(path: string, options?: { recursive?: boolean }): Promise<void> {
    await Deno.remove(path, options);
  }

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    await Deno.mkdir(path, options);
  }

  async *readDir(
    path: string,
  ): AsyncIterable<{ name: string; isFile: boolean; isDirectory: boolean }> {
    for await (const entry of Deno.readDir(path)) {
      yield {
        name: entry.name,
        isFile: entry.isFile,
        isDirectory: entry.isDirectory,
      };
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await Deno.rename(oldPath, newPath);
  }
}
