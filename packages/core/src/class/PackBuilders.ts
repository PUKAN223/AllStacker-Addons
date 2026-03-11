import chalk from "chalk";
import JSZip from "jszip";
import { FilterManagers, type Filters } from "./FilterManagers.ts";
import { FileManagers } from "./FileManagers.ts";
import { Logger } from "./Logger.ts";
import type { ConfigOptions } from "../types/ConfigOptions.ts";
import type { PackBuilderOptions } from "../types/PackBuilderOptions.ts";
import { BuilderManagers } from "./BuilderManagers.ts";
import * as path from "@std/path";

class PackBuilder {
  private packsPath: string = path.join(Deno.cwd(), "packs");
  private distPath: string = path.join(Deno.cwd(), "data", "dist");
  private addonsPath: string = path.join(Deno.cwd(), "data", "dist", "addons");
  private filtersPath: string = path.join(
    Deno.cwd(),
    "data",
    "filters",
    "<filtersName>",
    "index",
  );
  private filterManagers: FilterManagers;
  private fileManagers: FileManagers;
  private builderManagers: BuilderManagers;
  private logger: Logger;
  private config: ConfigOptions;

  constructor(options: PackBuilderOptions) {
    this.packsPath = options.packsPath || this.packsPath;
    this.distPath = options.distPath || this.distPath;
    this.config = options.config;
    this.fileManagers = new FileManagers();
    this.filterManagers = new FilterManagers();
    this.builderManagers = new BuilderManagers();
    this.logger = new Logger();
  }

  public async build() {
    const startTime = Date.now();
    this.logger.info("Building packs...");

    await this.fileManagers.createDirectory("./data/.cache");

    const bp = await this.fileManagers.syncDirectory(
      `${this.packsPath}/BP`,
      `${this.distPath}/BP`,
      "./data/.cache/bp.json",
      { concurrency: 24 },
    );

    const rp = await this.fileManagers.syncDirectory(
      `${this.packsPath}/RP`,
      `${this.distPath}/RP`,
      "./data/.cache/rp.json",
      { concurrency: 24 },
    );

    this.logger.info(
      `Sync BP: scanned ${bp.scanned}, copied ${bp.copied}, deleted ${bp.deleted}`,
    );
    this.logger.info(
      `Sync RP: scanned ${rp.scanned}, copied ${rp.copied}, deleted ${rp.deleted}`,
    );

    await this.loadFilters();
    await this.filterManagers.applyFilters();
    await this.runBuilders();
    const duration = Date.now() - startTime;
    this.logger.success(
      `Build completed successfully in ${duration}ms`,
    );
  }

  public async copyTo() {
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
    try {
      await this.fileManagers.removeDirectory(BPPath);
      await this.fileManagers.removeDirectory(RPPath);
    } catch (e) {
      this.logger.error(`Error removing existing packs: ${e}`);
    }
    await this.fileManagers.copyDirectory(`${this.distPath}/BP`, BPPath);
    await this.fileManagers.copyDirectory(`${this.distPath}/RP`, RPPath);

    this.logger.msg(
      `Copied to ${gamePath}/${this.getPackName("BP", this.config)}`,
      "BP",
      chalk.bgHex("#808080"),
    );

    this.logger.msg(
      `Copied to ${gamePath}/${this.getPackName("RP", this.config)}`,
      "RP",
      chalk.bgHex("#808080"),
    );
  }

  public async clean() {
    //fix
    if (!(this.fileManagers.exists(this.distPath))) {
      this.logger.info("Dist directory does not exist. Nothing to clean.");
      return;
    }
    await this.fileManagers.removeDirectory(this.distPath);
    this.logger.info("Cleaned dist directory.");
  }

  public async pack() {
    try {
      const exists = await this.fileManagers.exists(this.distPath);
      if (!exists) {
        this.logger.error(
          "Dist directory does not exist. Please run build first.",
        );
        return;
      }

      await this.fileManagers.createDirectory(this.addonsPath);

      const BPZip = new JSZip();
      const RPZip = new JSZip();
      const AddonZip = new JSZip();

      const addFolderToZip = async (zip: JSZip, folderPath: string) => {
        try {
          const exists = await this.fileManagers.exists(folderPath);
          if (!exists) {
            this.logger.error(`Folder does not exist: ${folderPath}`);
            return;
          }

          for await (
            const entry of this.fileManagers.readDirectory(folderPath)
          ) {
            const fullPath = path.join(folderPath, entry.name);

            if (entry.isDirectory) {
              const subFolder = zip.folder(entry.name);
              if (subFolder) {
                await addFolderToZip(subFolder, fullPath);
              }
            } else if (entry.isFile) {
              try {
                const data = await this.fileManagers.readFile(fullPath);
                zip.file(entry.name, data);
              } catch (err) {
                this.logger.error(`Error reading file ${fullPath}: ${err}`);
              }
            }
          }
        } catch (err) {
          this.logger.error(`Error processing folder ${folderPath}: ${err}`);
        }
      };

      const bpPath = path.join(this.distPath, "BP");
      const rpPath = path.join(this.distPath, "RP");

      this.logger.info(`Adding BP from: ${bpPath}`);
      await addFolderToZip(BPZip, bpPath);

      const addonBPFolder = AddonZip.folder("BP");
      if (addonBPFolder) {
        await addFolderToZip(addonBPFolder, bpPath);
      }

      this.logger.info(`Adding RP from: ${rpPath}`);
      await addFolderToZip(RPZip, rpPath);

      const addonRPFolder = AddonZip.folder("RP");
      if (addonRPFolder) {
        await addFolderToZip(addonRPFolder, rpPath);
      }

      // Write zips
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

      this.logger.info(`Generating BP zip...`);
      const bpZipData = await BPZip.generateAsync({ type: "uint8array" });
      await this.fileManagers.writeFile(bpZipPath, bpZipData);
      this.logger.info(`BP zip created: ${bpZipPath}`);

      this.logger.info(`Generating RP zip...`);
      const rpZipData = await RPZip.generateAsync({ type: "uint8array" });
      await this.fileManagers.writeFile(rpZipPath, rpZipData);
      this.logger.info(`RP zip created: ${rpZipPath}`);

      this.logger.info(`Generating Addon zip...`);
      const addonZipData = await AddonZip.generateAsync({ type: "uint8array" });
      if (addonZipData.length === 0) {
        throw new Error(
          "Addon zip data is empty - no files were added to the archive",
        );
      }
      await this.fileManagers.writeFile(addonZipPath, addonZipData);
      this.logger.info(
        `Addon zip created: ${addonZipPath} (${addonZipData.length} bytes)`,
      );

      // Verify the addon zip file exists before renaming
      const addonZipExists = await this.fileManagers.exists(addonZipPath);
      if (!addonZipExists) {
        throw new Error(`Addon zip file was not created: ${addonZipPath}`);
      }

      await this.fileManagers.renameFile(
        addonZipPath,
        mcaddonPath,
      );

      this.logger.success(`Packs have been zipped in ${this.addonsPath}`);
    } catch (err) {
      this.logger.error(`Error while packing: ${err}`);
    }
  }

  public filters(): FilterManagers {
    return this.filterManagers;
  }

  private async runBuilders(): Promise<void> {
    //
    this.logger.info("Running builders...");
    await this.builderManagers.buildPack();
  }

  private getPackName(
    packType: "BP" | "RP" | "Addon",
    config: ConfigOptions,
  ): string {
    return `${config.meta.name}@${config.meta.version.join(".")}` +
      (packType === "Addon" ? "" : `_${packType}`);
  }

  private async autoFindGamePath(): Promise<string | null> {
    // Probe common Bedrock locations on Windows; return the first that exists
    const candidates: string[] = [];

    const appData = Deno.env.get("APPDATA");
    const localAppData = Deno.env.get("LOCALAPPDATA");
    const userProfile = Deno.env.get("USERPROFILE");

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

    for (const candidate of candidates) {
      if (await this.fileManagers.exists(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private async loadFilters() {
    for (const filterConfig of this.config.filters) {
      let filterPath = this.filtersPath.replace(
        "<filtersName>",
        filterConfig.name,
      );
      // Ensure .ts extension for TypeScript modules
      if (!filterPath.endsWith(".ts")) {
        filterPath += ".ts";
      }
      // Convert Windows path to file:// URL
      const filterUrl = `file://${filterPath.replace(/\\/g, "/")}`;
      const filterModule = await import(filterUrl) as Record<string, unknown>;
      const FilterClass = filterModule[filterConfig.name] as typeof Filters;
      this.filterManagers.registerFilter(FilterClass);
    }
  }
}

export { PackBuilder };
