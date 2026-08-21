import { File } from  "@packages/core/src/class/File.ts";
import type { IFileSystemAdapter } from  "@packages/core/src/interfaces/IFileSystemAdapter.ts";
import { DenoFileSystemAdapter } from  "@packages/core/src/adapters/DenoFileSystemAdapter.ts";

type FileSig = { m: number; s: number }; // mtimeMs, size

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Retry-on-lock helpers
// ---------------------------------------------------------------------------
// On Windows, file handles can be held briefly by antivirus, the OS itself,
// or libvips (sharp) even after the originating call returns. Rather than
// doing a separate "is-free?" probe before each destructive operation (which
// creates a TOCTOU race), we retry the operation itself with exponential
// backoff whenever we see a locking error.

const LOCK_BASE_DELAY_MS = 50;
const LOCK_MAX_RETRIES = 8;

/** Returns true for Windows error codes that mean "file is in use". */
function isLockError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  // Deno surfaces Win32 error 32 as "os error 32" or "The process cannot access"
  // and error 5 (access denied during delete) as "os error 5".
  return (
    msg.includes("os error 32") ||
    msg.includes("os error 33") ||
    msg.includes("being used by another process") ||
    msg.includes("access is denied") ||
    msg.includes("os error 5")
  );
}

/**
 * Run `fn` and, if it throws a locking error, retry up to `LOCK_MAX_RETRIES`
 * times with exponential backoff.  Any non-locking error is rethrown
 * immediately without retry.
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let delay = LOCK_BASE_DELAY_MS;
  for (let attempt = 0; attempt <= LOCK_MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === LOCK_MAX_RETRIES || !isLockError(err)) throw err;
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 2, 2000); // cap at 2 s
    }
  }
  // unreachable, but satisfies TypeScript
  throw new Error("withRetry: exceeded max retries");
}

// ---------------------------------------------------------------------------
// FileManagers
// ---------------------------------------------------------------------------

class FileManagers {
  private fs: IFileSystemAdapter;

  constructor(fs?: IFileSystemAdapter) {
    this.fs = fs || new DenoFileSystemAdapter();
  }

  // -------------------------------------------------------------------------
  // Private utilities
  // -------------------------------------------------------------------------

  private async statSig(p: string): Promise<FileSig | null> {
    try {
      const st = await this.fs.stat(p);
      if (!st) return null;
      return { m: st.mtimeMs, s: st.size };
    } catch {
      return null;
    }
  }

  private normalizeRel(p: string): string {
    return p.replaceAll("\\", "/");
  }

  /**
   * Concurrent recursive file listing.
   * Sub-directories are walked in parallel — each level spawns all its
   * children concurrently rather than awaiting them one by one.
   */
  private async listFilesRecursive(root: string): Promise<string[]> {
    const entries: { name: string; isFile: boolean; isDirectory: boolean }[] = [];
    for await (const e of this.fs.readDir(root)) {
      entries.push(e);
    }

    const files: string[] = [];
    const subDirPromises: Promise<string[]>[] = [];

    for (const entry of entries) {
      const full = `${root}/${entry.name}`;
      if (entry.isDirectory) {
        subDirPromises.push(this.listFilesRecursive(full));
      } else if (entry.isFile) {
        files.push(full);
      }
    }

    const subResults = await Promise.all(subDirPromises);
    for (const sub of subResults) {
      files.push(...sub);
    }

    return files;
  }

  private async readJson<T>(p: string, fallback: T): Promise<T> {
    try {
      const t = await this.readFile(p);
      return JSON.parse(t.toString()) as T;
    } catch {
      return fallback;
    }
  }

  private async writeJson(p: string, v: unknown): Promise<void> {
    await this.createDirectory(p.split("/").slice(0, -1).join("/"));
    await this.writeFile(p, JSON.stringify(v, null, 2));
  }

  /**
   * Bounded concurrency pool — runs `fn` for every item in `items` with at
   * most `limit` tasks in flight simultaneously.
   */
  private async runPool<T>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<void>,
  ): Promise<void> {
    let i = 0;
    const workers = Array.from({ length: Math.max(1, limit) }, async () => {
      while (i < items.length) {
        const idx = i++;
        await fn(items[idx] as T);
      }
    });
    await Promise.all(workers);
  }

  // -------------------------------------------------------------------------
  // Directory methods
  // -------------------------------------------------------------------------

  /**
   * Incremental directory sync with bounded concurrency.
   *  - Copies only changed/new files (compared by mtime + size).
   *  - Removes files that no longer exist in source.
   */
  public async syncDirectory(
    sourceDir: string,
    destDir: string,
    options?: { concurrency?: number; ignore?: (rel: string) => boolean },
  ): Promise<{ copied: number; deleted: number; scanned: number }> {
    const conc = options?.concurrency ?? 24;
    const ignore = options?.ignore ?? (() => false);

    await this.createDirectory(destDir);

    const srcFiles = await this.listFilesRecursive(sourceDir);
    const destFiles = await this.exists(destDir) ? await this.listFilesRecursive(destDir) : [];

    const rels = srcFiles
      .map((abs) => this.normalizeRel(abs.slice(sourceDir.length + 1)))
      .filter((rel) => !ignore(rel));
      
    const destRels = destFiles
      .map((abs) => this.normalizeRel(abs.slice(destDir.length + 1)))
      .filter((rel) => !ignore(rel));

    let copied = 0;

    await this.runPool(rels, conc, async (rel) => {
      const src = `${sourceDir}/${rel}`;
      const dst = `${destDir}/${rel}`;

      const srcSig = await this.statSig(src);
      if (!srcSig) return;

      const dstSig = await this.statSig(dst);
      const changed = !dstSig || dstSig.m !== srcSig.m || dstSig.s !== srcSig.s;
      if (!changed) return;

      await this.createDirectory(dst.split("/").slice(0, -1).join("/"));
      await this.fs.copyFile(src, dst);
      copied++;
    });

    // Delete files that were removed from source
    const srcSet = new Set(rels);
    const removed = destRels.filter(
      (rel) => !srcSet.has(rel) && !ignore(rel),
    );

    let deleted = 0;
    await this.runPool(removed, conc, async (rel) => {
      const dst = `${destDir}/${rel}`;
      try {
        await withRetry(() => this.fs.remove(dst));
        deleted++;
      } catch (err) {
        // ENOENT — already gone, not an error
        if (err instanceof Error && err.message.includes("os error 2")) return;
        // Still locked after all retries — log and continue
        // deno-lint-ignore no-console
        console.warn(`[syncDirectory] Could not delete ${dst}: ${err}`);
      }
    });

    return { copied, deleted, scanned: rels.length };
  }

  /**
   * Recursively copy `source` into `destination` using a concurrent pool so
   * multiple files are copied in parallel instead of one at a time.
   */
  public async copyDirectory(
    source: string,
    destination: string,
    concurrency = 24,
  ): Promise<void> {
    await this.createDirectory(destination);

    const allFiles = await this.listFilesRecursive(source);

    await this.runPool(allFiles, concurrency, async (srcPath) => {
      const rel = this.normalizeRel(srcPath.slice(source.length + 1));
      const dstPath = `${destination}/${rel}`;
      await this.createDirectory(dstPath.split("/").slice(0, -1).join("/"));
      await this.copyFile(srcPath, dstPath);
    });
  }

  /**
   * Incrementally sync `source` into `destination` **without ever deleting the
   * destination directory**.  This mirrors how `@minecraft/core-build-tasks`
   * deploys packs — it overwrites individual files in-place so that any open
   * file handles held by a running Minecraft process stay valid (Windows does
   * not block in-place overwrites, only unlink/rmdir of open files).
   *
   * Files are skipped when mtime and size both match (same 1 s tolerance that
   * Mojang uses).  New files are created, existing ones are overwritten.
   * Files that exist in destination but not in source are left untouched.
   */
  public async copyDirectoryInPlace(
    source: string,
    destination: string,
    concurrency = 24,
  ): Promise<{ copied: number; skipped: number }> {
    const MTIME_TOLERANCE_MS = 1000;
    await this.createDirectory(destination);

    const allSrcFiles = await this.listFilesRecursive(source);

    let copied = 0;
    let skipped = 0;

    await this.runPool(allSrcFiles, concurrency, async (srcPath) => {
      const rel = this.normalizeRel(srcPath.slice(source.length + 1));
      const dstPath = `${destination}/${rel}`;

      // Check whether destination already matches source (size + mtime).
      try {
        const srcStat = await this.fs.stat(srcPath);
        const dstStat = await this.fs.stat(dstPath);
        if (srcStat && dstStat) {
          const samSize = srcStat.size === dstStat.size;
          const samTime = Math.abs(srcStat.mtimeMs - dstStat.mtimeMs) <= MTIME_TOLERANCE_MS;
          if (samSize && samTime) {
            skipped++;
            return;
          }
        }
      } catch {
        // destination doesn't exist yet — fall through to copy
      }

      await this.createDirectory(dstPath.split("/").slice(0, -1).join("/"));
      // withRetry handles transient EBUSY / os error 32 on Windows.
      await withRetry(() => this.fs.copyFile(srcPath, dstPath));
      copied++;
    });

    return { copied, skipped };
  }

  public async exists(path: string): Promise<boolean> {
    try {
      const st = await this.fs.stat(path);
      return st !== null;
    } catch {
      return false;
    }
  }

  public readDirectory(path: string): AsyncIterable<{ name: string; isFile: boolean; isDirectory: boolean }> {
    return this.fs.readDir(path);
  }

  /**
   * Remove a directory tree — checks that no file inside is locked by another
   * process before proceeding.
   */
  public async removeDirectory(path: string): Promise<void> {
    if (!(await this.exists(path))) return;
    await withRetry(() => this.fs.remove(path, { recursive: true }));
  }

  public async eachFileInDirectory(
    path: string,
    callback: (file: File) => void,
  ): Promise<void> {
    const entries: { name: string; isFile: boolean; isDirectory: boolean }[] = [];
    for await (const entry of this.fs.readDir(path)) {
      entries.push(entry);
    }

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = `${path}/${entry.name}`;
        if (!entry.isFile) {
          await this.eachFileInDirectory(fullPath, callback);
          return;
        }
        const fileInfo = new File({
          name: entry.name.split(".")[0] as string,
          path: fullPath,
          content: await this.readFile(fullPath),
          fsAdapter: this.fs,
        });
        callback(fileInfo);
      }),
    );
  }

  public async createDirectory(path: string): Promise<void> {
    await this.fs.mkdir(path, { recursive: true });
  }

  public async renameDirectory(
    oldPath: string,
    newPath: string,
  ): Promise<void> {
    await this.fs.rename(oldPath, newPath);
  }

  // -------------------------------------------------------------------------
  // File methods
  // -------------------------------------------------------------------------

  public readFile(path: string): Promise<string | Uint8Array> {
    return this.fs.readFile(path);
  }

  public async writeFile(
    path: string,
    content: string | Uint8Array,
  ): Promise<void> {
    try {
      await this.createDirectory(path.split("/").slice(0, -1).join("/"));
      await this.fs.writeFile(path, content);
    } catch (_e) {
      // ignore
    }
  }

  /**
   * Remove a single file — checks that the file is not locked by another
   * process before proceeding.
   */
  public async removeFile(path: string): Promise<void> {
    try {
      await withRetry(() => this.fs.remove(path));
    } catch (err) {
      // ENOENT — file already gone, not an error
      if (err instanceof Error && err.message.includes("os error 2")) return;
      throw err;
    }
  }

  public async copyFile(source: string, destination: string): Promise<void> {
    try {
      await this.fs.stat(source);
    } catch (err) {
      if (err instanceof Error && err.message.includes("os error 2")) return;
      throw err;
    }
    await withRetry(() => this.fs.copyFile(source, destination));
  }

  public async createFile(path: string): Promise<void> {
    await this.fs.writeFile(path, new Uint8Array());
  }

  public async renameFile(oldPath: string, newPath: string): Promise<void> {
    await this.fs.rename(oldPath, newPath);
  }
}

export { FileManagers };
