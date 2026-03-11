import { File } from "./File.ts";

type FileSig = { m: number; s: number }; // mtimeMs, size
type SyncCache = Record<string, FileSig>;

class FileManagers {
  constructor() {
  }

  private async statSig(p: string): Promise<FileSig | null> {
    try {
      const st = await Deno.stat(p);
      if (!st.isFile) return null;
      return { m: st.mtime?.getTime() ?? 0, s: st.size };
    } catch {
      return null;
    }
  }

  private normalizeRel(p: string) {
    return p.replaceAll("\\", "/");
  }

  private async listFilesRecursive(root: string): Promise<string[]> {
    const out: string[] = [];
    for await (const entry of Deno.readDir(root)) {
      const full = `${root}/${entry.name}`;
      if (entry.isDirectory) {
        out.push(...(await this.listFilesRecursive(full)));
      } else if (entry.isFile) {
        out.push(full);
      }
    }
    return out;
  }

  private async readJson<T>(p: string, fallback: T): Promise<T> {
    try {
      const t = await Deno.readTextFile(p);
      return JSON.parse(t) as T;
    } catch {
      return fallback;
    }
  }

  private async writeJson(p: string, v: unknown) {
    await this.createDirectory(p.split("/").slice(0, -1).join("/"));
    await Deno.writeTextFile(p, JSON.stringify(v, null, 2));
  }

  private async runPool<T>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<void>,
  ) {
    let i = 0;
    const workers = Array.from({ length: Math.max(1, limit) }, async () => {
      while (i < items.length) {
        const idx = i++;
        await fn(items[idx] as T);
      }
    });
    await Promise.all(workers);
  }

  /**
   * ✅ Incremental directory sync with cache + optional concurrency
   * - copies only changed/new files (mtime+size)
   * - removes files that no longer exist in source
   * - stores cache in cacheFile (json)
   */
  public async syncDirectory(
    sourceDir: string,
    destDir: string,
    cacheFile: string,
    options?: { concurrency?: number; ignore?: (rel: string) => boolean },
  ): Promise<{ copied: number; deleted: number; scanned: number }> {
    const conc = options?.concurrency ?? 24;
    const ignore = options?.ignore ?? (() => false);

    await this.createDirectory(destDir);

    const prev = await this.readJson<SyncCache>(cacheFile, {});
    const next: SyncCache = {};

    const srcFiles = await this.listFilesRecursive(sourceDir);
    const rels = srcFiles
      .map((abs) => this.normalizeRel(abs.slice(sourceDir.length + 1)))
      .filter((rel) => !ignore(rel));

    let copied = 0;

    await this.runPool(rels, conc, async (rel) => {
      const src = `${sourceDir}/${rel}`;
      const dst = `${destDir}/${rel}`;

      const sig = await this.statSig(src);
      if (!sig) return;

      next[rel] = sig;

      const old = prev[rel];
      const changed = !old || old.m !== sig.m || old.s !== sig.s;

      if (!changed) return;

      await this.createDirectory(dst.split("/").slice(0, -1).join("/"));
      await Deno.copyFile(src, dst);
      copied++;
    });

    // delete removed files from dest
    let deleted = 0;
    const removed = Object.keys(prev).filter((rel) =>
      !next[rel] && !ignore(rel)
    );

    await this.runPool(removed, conc, async (rel) => {
      const dst = `${destDir}/${rel}`;
      try {
        await Deno.remove(dst);
        deleted++;
      } catch {
        // ignore
      }
    });

    await this.writeJson(cacheFile, next);

    return { copied, deleted, scanned: rels.length };
  }

  //Directory Methods
  async copyDirectory(source: string, destination: string) {
    try {
      await this.createDirectory(destination);
      const entries = this.readDirectory(source);
      for await (const entry of entries) {
        const srcPath = `${source}/${entry.name}`;
        const destPath = `${destination}/${entry.name}`;
        if (entry.isDirectory) {
          await this.copyDirectory(srcPath, destPath);
        } else {
          await this.copyFile(srcPath, destPath);
        }
      }
    } catch {
      // ignore
    }
  }

  public async exists(path: string): Promise<boolean> {
    try {
      await Deno.stat(path);
      return true;
    } catch {
      return false;
    }
  }

  public readDirectory(path: string): AsyncIterable<Deno.DirEntry> {
    return Deno.readDir(path);
  }

  public async removeDirectory(path: string) {
    try {
      if (!(await this.exists(path))) return;
      await Deno.remove(path, { recursive: true });
    } catch {
      // Silently ignore if directory doesn't exist
    }
  }

  public async eachFileInDirectory(
    path: string,
    callback: (file: File) => void,
  ) {
    const dir = Deno.readDirSync(path);
    for (const file of dir) {
      if (!file.isFile) {
        await this.eachFileInDirectory(`${path}/${file.name}`, callback);
        continue;
      }
      // console.log(path)
      const fileInfo: File = new File({
        name: file.name.split(".")[0] as string,
        path: `${path}/${file.name}`,
        content: await this.readFile(`${path}/${file.name}`),
      });
      callback(fileInfo);
    }
  }

  public async createDirectory(path: string) {
    await Deno.mkdir(path, { recursive: true });
  }

  public async renameDirectory(oldPath: string, newPath: string) {
    await Deno.rename(oldPath, newPath);
  }

  //File Methods
  public readFile(path: string): Promise<string | Uint8Array> {
    const extension = path.split(".").pop()?.toLowerCase();
    if (
      extension &&
      ["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(extension)
    ) {
      return Deno.readFile(path);
    }
    return Deno.readTextFile(path);
  }

  public async writeFile(
    path: string,
    content: string | Uint8Array,
  ): Promise<void> {
    //create directory if not exists
    try {
      await this.createDirectory(path.split("/").slice(0, -1).join("/"));
      const extension = path.split(".").pop()?.toLowerCase();
      const binaryExtensions = [
        "png",
        "jpg",
        "jpeg",
        "gif",
        "webp",
        "bmp",
        "zip",
        "mcaddon",
      ];

      if (extension && binaryExtensions.includes(extension)) {
        if (content instanceof Uint8Array) {
          return Deno.writeFile(path, content);
        } else {
          throw new Error("Binary file content must be provided as Uint8Array");
        }
      } else {
        if (typeof content === "string") {
          return Deno.writeTextFile(path, content);
        } else {
          throw new Error("Text file content must be provided as string");
        }
      }
    } catch (_e) {
      //ignore
    }
  }

  public async removeFile(path: string) {
    try {
      await Deno.remove(path);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== "ENOENT") throw error;
    }
  }

  public async copyFile(source: string, destination: string) {
    try {
      await Deno.stat(source);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") return; // skip if source missing
      throw error;
    }
    await Deno.copyFile(source, destination);
  }

  public async createFile(path: string) {
    await Deno.writeFile(path, new Uint8Array());
  }

  public async renameFile(oldPath: string, newPath: string) {
    await Deno.rename(oldPath, newPath);
  }
}

export { FileManagers };
