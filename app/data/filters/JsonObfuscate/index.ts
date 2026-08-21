import { Filters } from "@axeth/core";
import chalk from "chalk";
import * as path from "@std/path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ObfuscateConfig {
  /** Convert all JSON string content to unicode escape sequences */
  unicode: boolean;
  /** Flood JSON tokens with garbage comments */
  comments: boolean;
  /** [min, max] length of each garbage comment */
  commentsSize: [number, number];
  /** Rename JSON files in renamable RP dirs to random UUIDs */
  renameJSON: boolean;
  /** Resolve texture paths in JSON and rename the actual texture files */
  renameTextures: boolean;
  /** Move renamed files into random deeply-nested folders */
  nestedFiles: boolean;
  /** [min, max] folder depth for nested paths */
  nestedRange: [number, number];
  /** Prefix prepended to every renamed file (supports unicode control chars) */
  renamePrefix: string;
  /** Flood every folder with random junk files */
  fileFlood: boolean;
  /** [min, max] number of junk files per folder */
  fileFloodCount: [number, number];
}

const DEFAULT_CONFIG: ObfuscateConfig = {
  unicode: true,
  comments: true,
  commentsSize: [40, 80],
  renameJSON: true,
  renameTextures: true,
  nestedFiles: true,
  nestedRange: [3, 6],
  renamePrefix: ".\u202E\u0015\u0014",
  fileFlood: false,
  fileFloodCount: [50, 100],
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function unicodeChar(ch: string): string {
  return "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0");
}

function stringToUnicode(s: string): string {
  return s.split("").map(unicodeChar).join("");
}

/**
 * Converts every quoted string inside a raw JSON string to its unicode
 * escape sequence equivalent, then fixes up structural `"` and `\n`.
 */
function jsonToUnicode(jsonString: string): string {
  const ignored = new Set(['"Array.skins"']);
  return jsonString
    .replace(
      /"([^"]*)"/g,
      (match) => ignored.has(match) ? match : stringToUnicode(match),
    )
    .replaceAll("\\u0022", '"')
    .replaceAll("\\u005c\\u006e", "\\u000a");
}

function randomJunkChar(): string {
  const r = Math.random();
  if (r < 0.2) return String.fromCharCode(Math.floor(Math.random() * 32));
  if (r < 0.4) {
    return String.fromCharCode(0x2500 + Math.floor(Math.random() * 0x50));
  }
  return String.fromCharCode(0x0400 + Math.floor(Math.random() * 0x200));
}

function randomComment(min: number, max: number): string {
  const length = randomInt(min, max);
  let garbage = "";
  for (let i = 0; i < length; i++) garbage += randomJunkChar();
  // \u202E = right-to-left override — makes reading in editors painful
  return "/*\u202E" + garbage + "\u202E*/";
}

/**
 * Strips comments and BOM so JSON.parse can handle Minecraft's dialect.
 */
function cleanJsonString(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")
    .replaceAll("\u0015", "\\u0015")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(?<!:)\/\/.*$/gm, "")
    .trim();
}

// ---------------------------------------------------------------------------
// FS helpers (Deno-native, no FileManagers needed for internal use)
// ---------------------------------------------------------------------------

async function listDir(dir: string): Promise<Deno.DirEntry[]> {
  const entries: Deno.DirEntry[] = [];
  try {
    for await (const e of Deno.readDir(dir)) entries.push(e);
  } catch {
    // dir doesn't exist
  }
  return entries;
}

async function collectFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  for (const entry of await listDir(dir)) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory) results.push(...await collectFiles(full));
    else if (entry.isFile) results.push(full);
  }
  return results;
}

async function collectJsonFiles(dir: string): Promise<string[]> {
  const all = await collectFiles(dir);
  return all.filter((f) => f.toLowerCase().endsWith(".json"));
}

async function subdirs(dir: string): Promise<string[]> {
  const results: string[] = [];
  for (const entry of await listDir(dir)) {
    if (entry.isDirectory) results.push(path.join(dir, entry.name));
  }
  return results;
}

async function deleteEmptyFolders(dir: string): Promise<number> {
  let count = 0;
  for (const sub of await subdirs(dir)) {
    count += await deleteEmptyFolders(sub);
  }
  const entries = await listDir(dir);
  const visible = entries.filter((e) => e.name !== ".DS_Store");
  if (visible.length === 0) {
    try {
      await Deno.remove(dir, { recursive: true });
      count++;
    } catch {
      // ignore
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

class JsonObfuscate extends Filters {
  private cfg!: ObfuscateConfig;
  private rpPath!: string;

  /** texture original path → new relative path (no extension) */
  private textureMap: Map<string, string> = new Map();
  /** dirs already processed by renameJSON (avoid double-rename) */
  private renamedDirs: Set<string> = new Set();

  override async apply(): Promise<void> {
    // Obfuscation is destructive — it must only run when building a release
    // pack (deno task packs). Skip silently in dev / build modes so the game
    // directory always receives readable, working files.
    const mode = Deno.env.get("AXETH_BUILD_MODE") ?? "build";
    if (mode !== "packs") {
      this.msg(
        chalk.yellow(
          `Skipped (mode="${mode}" — obfuscation only runs during "packs")`,
        ),
      );
      return;
    }

    this.cfg = this.buildConfig();
    this.rpPath = path.join(this.basePath, "RP");

    const rpExists = await this.dirExists(this.rpPath);
    if (!rpExists) {
      this.msg(chalk.yellow("No RP directory found — skipping obfuscation."));
      return;
    }

    // ── 1. Rename texture files & patch their paths in JSON ─────────────────
    if (this.cfg.renameTextures) {
      const count = await this.renameTextures(this.rpPath);
      this.msg(
        `Renamed ${chalk.green(String(count))} texture path(s) in JSON files`,
      );
    }

    // ── 2. Unicode-escape + comment-flood JSON files ─────────────────────────
    if (this.cfg.unicode || this.cfg.comments) {
      const { files, comments } = await this.obfuscateJSON(this.rpPath);
      this.msg(`Obfuscated ${chalk.green(String(files))} JSON file(s)`);
      if (this.cfg.comments) {
        this.msg(
          `Flooded ${chalk.green(String(comments))} garbage comment(s)`,
        );
      }
    }

    // ── 3. Rename JSON files in renamable dirs to UUIDs ──────────────────────
    if (this.cfg.renameJSON) {
      const count = await this.renameJSON(this.rpPath);
      this.msg(
        `Renamed ${chalk.green(String(count))} JSON file(s) to UUID names`,
      );
    }

    // ── 4. File flooding ──────────────────────────────────────────────────────
    if (this.cfg.fileFlood) {
      const count = await this.floodFiles(this.rpPath);
      this.msg(`Flooded ${chalk.green(String(count))} junk file(s)`);
    }

    // ── 5. Cleanup empty nested folders ──────────────────────────────────────
    const deleted = await deleteEmptyFolders(this.rpPath);
    if (deleted > 0) {
      this.msg(`Cleaned ${chalk.grey(String(deleted))} empty folder(s)`);
    }
  }

  // ---------------------------------------------------------------------------
  // Step implementations
  // ---------------------------------------------------------------------------

  /**
   * Walk all JSON files, find every "textures" key, and rename the physical
   * texture files to UUIDs (optionally moving them into nested folders).
   * Updates the JSON in-place with the new paths.
   */
  private async renameTextures(dir: string): Promise<number> {
    let count = 0;
    for (const filePath of await collectJsonFiles(dir)) {
      let raw: string;
      try {
        raw = await Deno.readTextFile(filePath);
      } catch {
        continue;
      }

      let obj: unknown;
      try {
        obj = JSON.parse(cleanJsonString(raw));
      } catch {
        continue;
      }

      const results = this.findKeysRecursive(
        obj as Record<string, unknown>,
        "textures",
      );
      if (results.length === 0) continue;

      for (const { parent, key } of results) {
        parent[key] = this.manipulateStrings(
          parent,
          key,
          (texPath: string) => {
            if (this.textureMap.has(texPath)) {
              return this.textureMap.get(texPath)!;
            }

            // Check the physical file exists (skip vanilla paths)
            const ext = this.getExtension(
              path.join(this.rpPath, texPath),
            );
            if (!ext) return texPath;

            const newDir = this.cfg.nestedFiles
              ? this.createNestedPath(this.rpPath)
              : path.dirname(path.join(this.rpPath, texPath))
                .replace(this.rpPath + "/", "")
                .replace(this.rpPath + "\\", "")
                .replaceAll("\\", "/");

            const newName = this.cfg.renamePrefix + randomUUID();
            const newRelative = path.join(newDir, newName).replaceAll(
              "\\",
              "/",
            );

            try {
              const oldFull = path.join(this.rpPath, texPath) + ext;
              const newFull = path.join(this.rpPath, newRelative) + ext;
              Deno.mkdirSync(path.dirname(newFull), { recursive: true });
              Deno.renameSync(oldFull, newFull);
              this.textureMap.set(texPath, newRelative);
              count++;
            } catch {
              return texPath;
            }
            return newRelative;
          },
        );
      }

      try {
        await Deno.writeTextFile(filePath, JSON.stringify(obj, null, 2));
      } catch {
        // ignore write error
      }
    }
    return count;
  }

  /**
   * Unicode-escape string values and/or flood JSON tokens with garbage
   * comments. Mirrors pack-obfuscator's obfuscateJSON exactly.
   */
  private async obfuscateJSON(
    dir: string,
  ): Promise<{ files: number; comments: number }> {
    let fileCount = 0;
    let commentCount = 0;

    // Particle files require format_version to remain as-is
    const ignoredByDir: Record<string, string[]> = {
      "/particles": ['"format_version": "1.10.0",'],
    };

    for (const entry of await listDir(dir)) {
      if (!entry.name.endsWith(".json")) continue;
      const fullPath = path.join(dir, entry.name);
      const parent = dir.replace(this.rpPath, "").replaceAll("\\", "/");

      let jsonString: string;
      try {
        jsonString = await Deno.readTextFile(fullPath);
      } catch {
        continue;
      }

      // Unescape any existing unicode sequences back to characters
      jsonString = jsonString.replace(
        /\\u([0-9a-fA-F]{4})/g,
        (_, hex) => String.fromCharCode(parseInt(hex, 16)),
      );

      // Temporarily replace ignored strings with placeholders
      const ignored = ignoredByDir[parent] ?? [];
      ignored.forEach((s, i) => {
        jsonString = jsonString.replaceAll(s, i.toString().repeat(50));
      });

      let content = this.cfg.unicode ? jsonToUnicode(jsonString) : jsonString;

      // Strip whitespace so comments sit right next to tokens
      content = content.replace(/\s+/g, "");

      if (this.cfg.comments) {
        const [min, max] = this.cfg.commentsSize;
        content = content.replace(/{|\}|\[|\]|,|":/g, (token) => {
          const prefix = token === '":' ? "" : randomComment(min, max);
          const suffix = randomComment(min, max);
          commentCount += 1 + Number(Boolean(prefix));
          return prefix + token + suffix;
        });
      }

      // Restore placeholders
      ignored.forEach((s, i) => {
        content = content.replaceAll(i.toString().repeat(50), s);
      });

      try {
        await Deno.writeTextFile(fullPath, content);
        fileCount++;
      } catch {
        // ignore
      }
    }

    // Recurse into subdirectories
    for (const sub of await subdirs(dir)) {
      const { files, comments } = await this.obfuscateJSON(sub);
      fileCount += files;
      commentCount += comments;
    }

    return { files: fileCount, comments: commentCount };
  }

  /**
   * Rename JSON files in RP asset directories (animations, entity, particles,
   * etc.) to random UUIDs and optionally move them into nested folders.
   */
  private async renameJSON(dir: string): Promise<number> {
    let count = 0;

    const renamableDirs = [
      "/animations",
      "/attachables",
      "/entity",
      "/particles",
      "/render_controllers",
      "/models/entity",
    ];

    for (const entry of await listDir(dir)) {
      if (!entry.name.endsWith(".json")) continue;
      const fullPath = path.join(dir, entry.name);
      const parent = dir.replace(this.rpPath, "").replaceAll("\\", "/");
      const renamable = renamableDirs.find((d) => parent.startsWith(d));
      if (!renamable || this.renamedDirs.has(parent)) continue;

      const newSubDir = this.cfg.nestedFiles
        ? this.createNestedPath(
          path.join(this.rpPath, renamable),
          this.rpPath,
        )
        : parent;

      const newName = this.cfg.renameJSON
        ? this.cfg.renamePrefix + randomUUID() + ".json"
        : entry.name;

      const newFull = path.join(this.rpPath, newSubDir, newName);

      if (fullPath === newFull) continue;
      try {
        Deno.mkdirSync(path.dirname(newFull), { recursive: true });
        await Deno.rename(fullPath, newFull);
        this.renamedDirs.add(newSubDir);
        count++;
      } catch {
        // ignore rename error
      }
    }

    for (const sub of await subdirs(dir)) {
      count += await this.renameJSON(sub);
    }
    return count;
  }

  /**
   * Write random junk files into every folder to make navigation annoying.
   */
  private async floodFiles(dir: string): Promise<number> {
    const extensions = [
      ".gif",
      ".bmp",
      ".webp",
      ".exe",
      ".txt",
      ".log",
      ".csv",
      ".xml",
      ".yaml",
      ".ini",
      ".cfg",
      ".dat",
      ".bin",
      ".zip",
      ".rar",
      ".tar",
      ".gz",
    ];

    const [min, max] = this.cfg.fileFloodCount;
    const amount = randomInt(min, max);
    let count = 0;

    for (let i = 0; i < amount; i++) {
      const ext = extensions[randomInt(0, extensions.length - 1)];
      const filePath = path.join(dir, randomUUID() + ext);
      try {
        await Deno.writeTextFile(filePath, randomJunkChar());
        count++;
      } catch {
        // ignore
      }
    }

    for (const sub of await subdirs(dir)) {
      count += await this.floodFiles(sub);
    }
    return count;
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  /**
   * Create a random nested subfolder under `base` and return the relative
   * path from `relativeTo` (defaults to base).
   */
  private createNestedPath(base: string, relativeTo?: string): string {
    const [min, max] = this.cfg.nestedRange;
    const folders: string[] = ["\u0015nested"];
    for (let i = 0; i < randomInt(min, max); i++) {
      folders.push(randomInt(0, 9).toString());
    }
    const full = path.join(base, ...folders);
    try {
      Deno.mkdirSync(full, { recursive: true });
    } catch {
      // already exists
    }
    const root = relativeTo ?? base;
    return full
      .replace(root + "/", "")
      .replace(root + "\\", "")
      .replaceAll("\\", "/");
  }

  /**
   * Try to find a physical file with the same base name as `filePath` and
   * return its extension (e.g. ".png").  Returns null if not found.
   */
  private getExtension(filePath: string): string | null {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);
    try {
      for (const entry of Deno.readDirSync(dir)) {
        const entryBase = entry.name.slice(
          0,
          entry.name.length - path.extname(entry.name).length,
        );
        if (entryBase === base) return path.extname(entry.name);
      }
    } catch {
      // dir doesn't exist
    }
    return null;
  }

  /** Recursively find all `{ parent, key }` pairs where key matches. */
  private findKeysRecursive(
    obj: Record<string, unknown>,
    key: string,
    results: Array<{ parent: Record<string, unknown>; key: string }> = [],
  ): Array<{ parent: Record<string, unknown>; key: string }> {
    if (!obj || typeof obj !== "object") return results;
    if (key in obj) results.push({ parent: obj, key });
    for (const val of Object.values(obj)) {
      if (val && typeof val === "object") {
        this.findKeysRecursive(val as Record<string, unknown>, key, results);
      }
    }
    return results;
  }

  /**
   * Apply `transform` to every string value under `parent[key]`, whether it
   * is a plain string, an array of strings, or an object of strings.
   */
  private manipulateStrings(
    parent: Record<string, unknown>,
    key: string,
    transform: (s: string) => string,
  ): unknown {
    const value = parent[key];
    if (typeof value === "string") return (parent[key] = transform(value));
    if (Array.isArray(value)) {
      return (parent[key] = value.map((v) =>
        typeof v === "string" ? transform(v) : v
      ));
    }
    if (value !== null && typeof value === "object") {
      for (const k of Object.keys(value as object)) {
        const v = (value as Record<string, unknown>)[k];
        if (typeof v === "string") {
          (value as Record<string, unknown>)[k] = transform(v);
        }
      }
    }
    return parent[key];
  }

  private async dirExists(p: string): Promise<boolean> {
    try {
      return (await Deno.stat(p)).isDirectory;
    } catch {
      return false;
    }
  }

  /** Merge filter config from config.json with defaults. */
  private buildConfig(): ObfuscateConfig {
    const raw = (this as unknown as { config?: Partial<ObfuscateConfig> })
      .config ?? {};
    return { ...DEFAULT_CONFIG, ...raw };
  }
}

export { JsonObfuscate };
