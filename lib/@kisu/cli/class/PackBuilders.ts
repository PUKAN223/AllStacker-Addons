import { ConfigOptions, PackBuilderOptions, FileManagers, FilterManagers, Logger, Filters } from "@kisu/cli";
import chalk, { ChalkObj } from "jsr:@nothing628/chalk@1.0.1";
import JSZip from "npm:jszip@3.10.1";

class PackBuilder {
  private packsPath: string = "./packs";
  private distPath: string = "./data/dist";
  private addonsPath: string = "./data/dist/addons";
  private filtersPath: string = `${"../".repeat(4)}data/filters/<filtersName>/index.ts`;
  private filterManagers: FilterManagers;
  private fileManagers: FileManagers;
  private logger: Logger;
  private config: ConfigOptions;

  constructor(options: PackBuilderOptions) {
    this.packsPath = options.packsPath || this.packsPath;
    this.distPath = options.distPath || this.distPath;
    this.config = options.config;
    this.fileManagers = new FileManagers();
    this.filterManagers = new FilterManagers();
    this.logger = new Logger();
  }

  public async build() {
    this.logger.info("Building packs...");
    this.fileManagers.removeDirectory(this.distPath);
    this.fileManagers.createDirectory(this.distPath);

    await this.fileManagers.copyDirectory(
      `${this.packsPath}/BP`,
      `${this.distPath}/BP`,
    );

    await this.fileManagers.copyDirectory(
      `${this.packsPath}/RP`,
      `${this.distPath}/RP`,
    );

    await this.loadFilters();
    await this.filterManagers.applyFilters();
    this.logger.success(`Successfully processed files`);
  }

  public copyTo() {
    const BPPath =
      `${this.config.env.GamePath}/development_behavior_packs/${this.getPackName("BP", this.config)}`;
    const RPPath =
      `${this.config.env.GamePath}/development_resource_packs/${this.getPackName("RP", this.config)}`;

    try {
      this.fileManagers.removeDirectory(BPPath);
      this.fileManagers.removeDirectory(RPPath);
    } catch (e) {
      this.logger.error(`Error removing existing packs: ${e}`);
    }

    this.fileManagers.copyDirectory(`${this.distPath}/BP`, BPPath);
    this.fileManagers.copyDirectory(`${this.distPath}/RP`, RPPath);

    this.logger.msg(
      `Copied to ${this.config.env.GamePath}/${this.getPackName("BP", this.config)}`,
      "BP",
      chalk.bgHex("#808080") as ChalkObj,
    )

    this.logger.msg(
      `Copied to ${this.config.env.GamePath}/${this.getPackName("RP", this.config)}`,
      "RP",
      chalk.bgHex("#808080") as ChalkObj,
    )
  }

  public clean() {
    this.fileManagers.removeDirectory(this.distPath);
    this.logger.info("Cleaned dist directory.");
  }

  public async pack() {
    try {
      const exists = await Deno.stat(this.distPath).catch(() => false);
      if (!exists) {
        this.logger.error(
          "Dist directory does not exist. Please run build first.",
        );
        return;
      }

      this.fileManagers.createDirectory(this.addonsPath);

      const BPZip = new JSZip();
      const RPZip = new JSZip();
      const AddonZip = new JSZip();

      const addFolderToZip = async (zip: JSZip, folderPath: string) => {
        for await (const entry of Deno.readDir(folderPath)) {
          const fullPath = `${folderPath}/${entry.name}`;

          if (entry.isDirectory) {
            const subFolder = zip.folder(entry.name);
            if (subFolder) {
              await addFolderToZip(subFolder, fullPath);
            }
          } else if (entry.isFile) {
            const data = await Deno.readFile(fullPath);
            zip.file(entry.name, data);
          }
        }
      };

      await addFolderToZip(BPZip, `${this.distPath}/BP`);
      await addFolderToZip(
        AddonZip.folder("BP")!,
        `${this.distPath}/BP`,
      );

      await addFolderToZip(RPZip, `${this.distPath}/RP`);
      await addFolderToZip(
        AddonZip.folder("RP")!,
        `${this.distPath}/RP`,
      );

      // Write zips
      await Deno.writeFile(
        `${this.addonsPath}/${this.getPackName("BP", this.config)}.zip`,
        await BPZip.generateAsync({ type: "uint8array" }),
      );

      await Deno.writeFile(
        `${this.addonsPath}/${this.getPackName("RP", this.config)}.zip`,
        await RPZip.generateAsync({ type: "uint8array" }),
      );

      await Deno.writeFile(
        `${this.addonsPath}/${this.getPackName("Addon", this.config)}.zip`,
        await AddonZip.generateAsync({ type: "uint8array" }),
      );

      this.fileManagers.renameFile(
        `${this.addonsPath}/${this.getPackName("Addon", this.config)}.zip`,
        `${this.addonsPath}/${this.getPackName("Addon", this.config)}.mcaddon`,
      );

      this.logger.success(`Packs have been zipped in ${this.addonsPath}`);
    } catch (err) {
      this.logger.error(`Error while packing: ${err}`);
    }
  }

  public filters() {
    return this.filterManagers;
  }

  private getPackName(packType: "BP" | "RP" | "Addon", config: ConfigOptions): string {
    return `${config.meta.name}@${config.meta.version.join(".")}` + (packType === "Addon" ? "" : `_${packType}`);
  }

  private async loadFilters() {
    for (const filterConfig of this.config.filters) {
      const filterPath = `${this.filtersPath.replace("<filtersName>", filterConfig.name)}`;
      const filterModule = await import(filterPath);
      const FilterClass = filterModule[filterConfig.name] as typeof Filters;
      this.filterManagers.registerFilter(FilterClass);
    }
  }
}

export { PackBuilder };
