import chalk from "chalk";
import { FilterManagers, type Filters } from  "@packages/core/src/class/FilterManagers.ts";
import { FileManagers } from  "@packages/core/src/class/FileManagers.ts";
import { Logger } from  "@packages/core/src/class/Logger.ts";
import type { ConfigOptions } from  "@packages/core/src/types/ConfigOptions.ts";
import type { PackBuilderOptions } from  "@packages/core/src/types/PackBuilderOptions.ts";
import { BuilderManagers } from  "@packages/core/src/class/BuilderManagers.ts";
import * as path from "@std/path";
import type { IArchiveAdapter } from  "@packages/core/src/interfaces/IArchiveAdapter.ts";
import type { IImageOptimizerAdapter } from  "@packages/core/src/interfaces/IImageOptimizerAdapter.ts";
import { JSZipArchiveAdapter } from  "@packages/core/src/adapters/JSZipArchiveAdapter.ts";
import { SharpOptimizerAdapter } from  "@packages/core/src/adapters/SharpOptimizerAdapter.ts";
import type { IEnvironmentAdapter } from "@packages/core/src/interfaces/IEnvironmentAdapter.ts";
import { DenoEnvironmentAdapter } from "@packages/core/src/adapters/DenoEnvironmentAdapter.ts";

class PackBuilder {
  private packsPath: string;
  private distPath: string;
  private addonsPath: string;
  private filtersPath: string;
  private filterManagers: FilterManagers;
  private fileManagers: FileManagers;
  private builderManagers: BuilderManagers;
  private logger: Logger;
  private config: ConfigOptions;
  private archiveAdapter: IArchiveAdapter;
  private imageOptimizerAdapter: IImageOptimizerAdapter;
  private envAdapter: IEnvironmentAdapter;

  constructor(options: PackBuilderOptions) {
    this.config = options.config;
    this.logger = new Logger(options.loggerAdapter);
    this.fileManagers = new FileManagers(options.fsAdapter);
    this.envAdapter = options.envAdapter || new DenoEnvironmentAdapter();
    this.builderManagers = new BuilderManagers(this.fileManagers, this.logger, this.envAdapter);
    this.archiveAdapter = options.archiveAdapter || new JSZipArchiveAdapter();
    this.imageOptimizerAdapter = options.imageOptimizerAdapter || new SharpOptimizerAdapter();
    this.filterManagers = new FilterManagers(this.logger, this.fileManagers);
    
    const cwd = this.envAdapter.getCwd();
    this.packsPath = path.join(cwd, "packs");
    this.distPath = path.join(cwd, "data", "dist");
    this.addonsPath = path.join(cwd, "data", "dist", "addons");
    this.filtersPath = path.join(cwd, "data", "filters", "<filtersName>", "index");
  }

  // ---------------------------------------------------------------------------
  // Public commands
  // ---------------------------------------------------------------------------

  public async build(): Promise<void> {
    const startTime = Date.now();
    // this.logger.info("Building packs...");

    await this.clean();

    const [bp, rp] = await Promise.all([
      this.fileManagers.syncDirectory(
        `${this.packsPath}/BP`,
        `${this.distPath}/BP`,
        { concurrency: 24 },
      ),
      this.fileManagers.syncDirectory(
        `${this.packsPath}/RP`,
        `${this.distPath}/RP`,
        { concurrency: 24 },
      ),
    ]);

    this.logger.debug(
      `Sync BP: scanned ${bp.scanned}, copied ${bp.copied}, deleted ${bp.deleted}`,
    );
    this.logger.debug(
      `Sync RP: scanned ${rp.scanned}, copied ${rp.copied}, deleted ${rp.deleted}`,
    );

    await this.loadFilters();
    await this.filterManagers.applyFilters();
    await this.runBuilders();

    const duration = Date.now() - startTime;
    this.logger.success(`Build completed successfully in ${duration}ms`);
  }

  public async copyTo(): Promise<void> {
    const gamePath = this.config.env.GamePath || await this.autoFindGamePath();
    if (!gamePath) {
      this.logger.error(
        "Could not determine Minecraft game path. Please set the GamePath in the config.",
      );
      return;
    }

    const BPPath = path.join(
      gamePath,
      "development_behavior_packs",
      this.getPackName("BP", this.config),
    );
    const RPPath = path.join(
      gamePath,
      "development_resource_packs",
      this.getPackName("RP", this.config),
    );

    // Copy in-place (overwrite individual files, never delete the destination
    // directory).  This matches how @minecraft/core-build-tasks deploys packs —
    // Minecraft holds open handles to files inside development_*_packs; deleting
    // the folder triggers os error 32, but overwriting the file contents in-place
    // is always allowed by Windows even while the game is running.
    const [bp, rp] = await Promise.all([
      this.fileManagers.copyDirectoryInPlace(`${this.distPath}/BP`, BPPath),
      this.fileManagers.copyDirectoryInPlace(`${this.distPath}/RP`, RPPath),
    ]);

    this.logger.msg(
      `BP → ${BPPath}  (${bp.copied} copied, ${bp.skipped} skipped)`,
      "BP",
      chalk.bgHex("#808080"),
    );
    this.logger.msg(
      `RP → ${RPPath}  (${rp.copied} copied, ${rp.skipped} skipped)`,
      "RP",
      chalk.bgHex("#808080"),
    );
  }

  public async clean(): Promise<void> {
    if (!(await this.fileManagers.exists(this.distPath))) {
      this.logger.debug("Dist directory does not exist. Nothing to clean.");
      return;
    }
    await this.fileManagers.removeDirectory(this.distPath);
    this.logger.debug("Cleaned dist directory.");
  }

  public async pack(): Promise<void> {
    try {
      const exists = await this.fileManagers.exists(this.distPath);
      if (!exists) {
        this.logger.error(
          "Dist directory does not exist. Please run build first.",
        );
        return;
      }

      await this.fileManagers.createDirectory(this.addonsPath);

      const bpPath = path.join(this.distPath, "BP");
      const rpPath = path.join(this.distPath, "RP");

      this.logger.debug("Building BP and RP zips in parallel...");
      const [BPZip, RPZip] = await Promise.all([
        this.buildZipFromFolder(bpPath),
        this.buildZipFromFolder(rpPath),
      ]);

      this.logger.debug("Building Addon zip...");
      const AddonZip = this.archiveAdapter.createNew();
      AddonZip.addFolder("BP");
      AddonZip.addFolder("RP");
      const addonBP = AddonZip.getFolder("BP")!;
      const addonRP = AddonZip.getFolder("RP")!;

      await Promise.all([
        this.addFolderToZip(addonBP, bpPath),
        this.addFolderToZip(addonRP, rpPath),
      ]);

      this.logger.debug("Generating zip archives in parallel...");
      const [bpZipData, rpZipData, addonZipData] = await Promise.all([
        BPZip.generate(),
        RPZip.generate(),
        AddonZip.generate(),
      ]);

      if (addonZipData.length === 0) {
        throw new Error(
          "Addon zip data is empty — no files were added to the archive",
        );
      }

      const bpZipPath = path.join(
        this.addonsPath,
        `${this.getPackName("BP", this.config)}.zip`,
      );
      const rpZipPath = path.join(
        this.addonsPath,
        `${this.getPackName("RP", this.config)}.zip`,
      );
      const addonZipPath = path.join(
        this.addonsPath,
        `${this.getPackName("Addon", this.config)}.zip`,
      );
      const mcaddonPath = path.join(
        this.addonsPath,
        `${this.getPackName("Addon", this.config)}.mcaddon`,
      );

      this.logger.debug("Writing zip files...");
      await Promise.all([
        this.fileManagers.writeFile(bpZipPath, bpZipData).then(() =>
          this.logger.debug(`BP zip created: ${bpZipPath}`)
        ),
        this.fileManagers.writeFile(rpZipPath, rpZipData).then(() =>
          this.logger.debug(`RP zip created: ${rpZipPath}`)
        ),
        this.fileManagers.writeFile(addonZipPath, addonZipData).then(() =>
          this.logger.debug(
            `Addon zip created: ${addonZipPath} (${addonZipData.length} bytes)`,
          )
        ),
      ]);

      const addonZipExists = await this.fileManagers.exists(addonZipPath);
      if (!addonZipExists) {
        throw new Error(`Addon zip file was not created: ${addonZipPath}`);
      }

      await this.fileManagers.renameFile(addonZipPath, mcaddonPath);
      this.logger.success(`Packs have been zipped in ${this.addonsPath}`);
    } catch (err) {
      this.logger.error(`Error while packing: ${err}`);
    }
  }

  public async optimize(): Promise<void> {
    const startTime = Date.now();

    if (!(await this.fileManagers.exists(this.distPath))) {
      this.logger.error(
        "Dist directory does not exist. Please run build first.",
      );
      return;
    }

    // Collect all files from both packs
    const allFiles: string[] = [];
    for (const pack of ["BP", "RP"]) {
      const packPath = path.join(this.distPath, pack);
      if (!(await this.fileManagers.exists(packPath))) continue;
      allFiles.push(...await this.listAllFiles(packPath));
    }

    const isRpUi = (f: string) => f.replace(/\\/g, "/").includes("RP/ui/");

    const pngFiles = allFiles.filter(
      (f) => f.toLowerCase().endsWith(".png") && !isRpUi(f),
    );
    const jpgFiles = allFiles.filter(
      (f) => /\.(jpg|jpeg)$/i.test(f) && !isRpUi(f),
    );
    const jsonFiles = allFiles.filter(
      (f) => f.toLowerCase().endsWith(".json") && !isRpUi(f),
    );

    if (
      pngFiles.length === 0 && jpgFiles.length === 0 && jsonFiles.length === 0
    ) {
      this.logger.info("No optimizable files found.");
      return;
    }

    this.logger.info(
      `Found ${pngFiles.length} PNG, ${jpgFiles.length} JPG, ${jsonFiles.length} JSON — starting optimization...`,
    );

    // ── counters ────────────────────────────────────────────────────────────
    let pngOptimized = 0, pngSkipped = 0, pngSaved = 0;
    let jpgOptimized = 0, jpgSkipped = 0, jpgSaved = 0;
    let jsonOptimized = 0, jsonSkipped = 0, jsonSaved = 0;

    // ── PNG ──────────────────────────────────────────────────────────────────
    // Two passes are tried per file and the smaller wins:
    //   1. Palette / indexed (8-bit, ≤256 colours) — wins on pixel art / icons
    //   2. Truecolour with maximum deflate — wins on gradients / photos
    // sharp strips all metadata by default (no withMetadata call = no metadata).
    if (pngFiles.length > 0) {
      this.logger.process(`Optimizing ${pngFiles.length} PNG(s)...`);
      await this.runOptimizePool(pngFiles, 8, async (filePath) => {
        try {
          const originalData = await this.fileManagers.readFile(filePath);
          const original = typeof originalData === "string" ? new TextEncoder().encode(originalData) : originalData;

          const best = await this.imageOptimizerAdapter.optimizePng(original);

          if (best.length < original.length) {
            pngSaved += original.length - best.length;
            await this.fileManagers.writeFile(filePath, best);
            pngOptimized++;
          } else {
            pngSkipped++;
          }
        } catch (err) {
          this.logger.error(`PNG optimize failed [${filePath}]: ${err}`);
          pngSkipped++;
        }
      });
    }

    // ── JPG ──────────────────────────────────────────────────────────────────
    // MozJPEG encoder with progressive scan and all trellis/deringing options.
    // Metadata is stripped by default (no withMetadata call).
    if (jpgFiles.length > 0) {
      this.logger.process(`Optimizing ${jpgFiles.length} JPG(s)...`);
      await this.runOptimizePool(jpgFiles, 8, async (filePath) => {
        try {
          const originalData = await this.fileManagers.readFile(filePath);
          const original = typeof originalData === "string" ? new TextEncoder().encode(originalData) : originalData;
          const compressed = await this.imageOptimizerAdapter.optimizeJpg(original);

          if (compressed.length < original.length) {
            jpgSaved += original.length - compressed.length;
            await this.fileManagers.writeFile(filePath, compressed);
            jpgOptimized++;
          } else {
            jpgSkipped++;
          }
        } catch (err) {
          this.logger.error(`JPG optimize failed [${filePath}]: ${err}`);
          jpgSkipped++;
        }
      });
    }

    // ── JSON ─────────────────────────────────────────────────────────────────
    // Parse → re-stringify without whitespace (minify).
    // Handles UTF-8 BOM; skips files with comments / JSON5 syntax gracefully.
    if (jsonFiles.length > 0) {
      this.logger.process(`Minifying ${jsonFiles.length} JSON(s)...`);
      await this.runOptimizePool(jsonFiles, 16, async (filePath) => {
        try {
          const originalData = await this.fileManagers.readFile(filePath);
          const original = typeof originalData === "string" ? originalData : new TextDecoder().decode(originalData);

          // Strip UTF-8 BOM if present
          const src = original.charCodeAt(0) === 0xFEFF
            ? original.slice(1)
            : original;

          let parsed: unknown;
          try {
            parsed = JSON.parse(src);
          } catch {
            // Not valid strict JSON (e.g. has comments / trailing commas) — skip
            jsonSkipped++;
            return;
          }

          const minified = JSON.stringify(parsed);
          if (minified.length < original.length) {
            jsonSaved += original.length - minified.length;
            await this.fileManagers.writeFile(filePath, minified);
            jsonOptimized++;
          } else {
            jsonSkipped++;
          }
        } catch (err) {
          this.logger.error(`JSON optimize failed [${filePath}]: ${err}`);
          jsonSkipped++;
        }
      });
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    const duration = Date.now() - startTime;
    const totalSaved = pngSaved + jpgSaved + jsonSaved;
    const kb = (n: number) => (n / 1024).toFixed(1);

    this.logger.success(
      [
        `Optimize completed in ${duration}ms  |  Total saved: ${
          kb(totalSaved)
        } KB`,
        `  PNG  : ${pngOptimized} optimized, ${pngSkipped} skipped  → saved ${
          kb(pngSaved)
        } KB`,
        `  JPG  : ${jpgOptimized} optimized, ${jpgSkipped} skipped  → saved ${
          kb(jpgSaved)
        } KB`,
        `  JSON : ${jsonOptimized} minified,  ${jsonSkipped} skipped  → saved ${
          kb(jsonSaved)
        } KB`,
      ].join("\n"),
    );
  }

  public filters(): FilterManagers {
    return this.filterManagers;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async listAllFiles(dir: string): Promise<string[]> {
    const results: string[] = [];
    for await (const entry of this.fileManagers.readDirectory(dir)) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory) {
        results.push(...await this.listAllFiles(full));
      } else if (entry.isFile) {
        results.push(full);
      }
    }
    return results;
  }

  private async runOptimizePool(
    items: string[],
    limit: number,
    fn: (item: string) => Promise<void>,
  ): Promise<void> {
    let i = 0;
    const workers = Array.from({ length: Math.max(1, limit) }, async () => {
      while (i < items.length) {
        const idx = i++;
        await fn(items[idx]!);
      }
    });
    await Promise.all(workers);
  }

  private async buildZipFromFolder(folderPath: string): Promise<IArchiveAdapter> {
    const zip = this.archiveAdapter.createNew();
    await this.addFolderToZip(zip, folderPath);
    return zip;
  }

  private async addFolderToZip(
    zip: IArchiveAdapter,
    folderPath: string,
  ): Promise<void> {
    const exists = await this.fileManagers.exists(folderPath);
    if (!exists) {
      this.logger.error(`Folder does not exist: ${folderPath}`);
      return;
    }

    const entries: { name: string; isFile: boolean; isDirectory: boolean }[] = [];
    for await (const entry of this.fileManagers.readDirectory(folderPath)) {
      entries.push(entry);
    }

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(folderPath, entry.name);
        if (entry.isDirectory) {
          zip.addFolder(entry.name);
          const subZip = zip.getFolder(entry.name);
          if (subZip) await this.addFolderToZip(subZip, fullPath);
        } else if (entry.isFile) {
          try {
            const data = await this.fileManagers.readFile(fullPath);
            zip.addFile(entry.name, data);
          } catch (err) {
            this.logger.error(`Error reading file ${fullPath}: ${err}`);
          }
        }
      }),
    );
  }

  private async runBuilders(): Promise<void> {
    // this.logger.info("Running builders...");
    await this.builderManagers.buildPack();
  }

  private getPackName(
    packType: "BP" | "RP" | "Addon",
    config: ConfigOptions,
  ): string {
    return config.meta.name + (packType === "Addon" ? "" : `_${packType}`);
  }

  private async autoFindGamePath(): Promise<string | null> {
    const appData = this.envAdapter.getEnv("APPDATA");
    const localAppData = this.envAdapter.getEnv("LOCALAPPDATA");
    const userProfile = this.envAdapter.getEnv("USERPROFILE");

    const candidates: string[] = [];

    if (appData) {
      candidates.push(
        path.join(
          appData,
          "Minecraft Bedrock",
          "users",
          "Shared",
          "games",
          "com.mojang",
        ),
      );
    }
    if (localAppData) {
      candidates.push(
        path.join(
          localAppData,
          "Packages",
          "Microsoft.MinecraftUWP_8wekyb3d8bbwe",
          "LocalState",
          "games",
          "com.mojang",
        ),
      );
    }
    if (userProfile) {
      candidates.push(
        path.join(
          userProfile,
          "AppData",
          "Local",
          "Packages",
          "Microsoft.MinecraftUWP_8wekyb3d8bbwe",
          "LocalState",
          "games",
          "com.mojang",
        ),
      );
    }

    const results = await Promise.all(
      candidates.map(async (c) => ({
        path: c,
        exists: await this.fileManagers.exists(c),
      })),
    );

    return results.find((r) => r.exists)?.path ?? null;
  }

  private async loadFilters(): Promise<void> {
    await Promise.all(
      this.config.filters.map(async (filterConfig) => {
        let filterPath = this.filtersPath.replace(
          "<filtersName>",
          filterConfig.name,
        );
        if (!filterPath.endsWith(".ts")) {
          filterPath += ".ts";
        }
        const filterUrl = `file://${filterPath.replace(/\\/g, "/")}`;
        const filterModule = await import(filterUrl) as Record<string, unknown>;
        const FilterClass = filterModule[filterConfig.name] as typeof Filters;
        this.filterManagers.registerFilter(FilterClass);
      }),
    );
  }
}

export { PackBuilder };
