import chalk from "chalk";
import { ConfigManagers } from "./ConfigManagers.ts";
import { Logger } from "./Logger.ts";
import { PackBuilder } from "./PackBuilders.ts";

class AxethCore {
  private args: string[];
  private logger: Logger = new Logger();
  private debounceTimer: number | null = null;

  constructor(args: string[] = Deno.args) {
    this.args = args;

    if (this.isDevWatchCommand()) {
      this.devWatch();
    } else {
      this.run();
    }
  }

  private async run() {
    console.clear();

    const config = await new ConfigManagers().getConfig();
    this.logger.info(
      `Loaded config pack: ${config.meta.name}@${
        config.meta.version.join(".")
      }`,
    );

    const pb = new PackBuilder({
      name: config.meta.name,
      config,
    });

    if (this.isHelpCommand()) {
      this.logger.msg(
        "bun run index.js [--build] [--packs] [--clean] [--dev:watch]",
        "Usage",
        chalk.bgHex("#808080"),
      );
      Deno.exit(0);
    }

    if (this.isCleanCommand()) pb.clean();
    if (this.isBuildCommand()) await pb.build();
    if (this.isPacksCommand()) pb.pack();

    if (
      !(this.isBuildCommand() || this.isPacksCommand() || this.isCleanCommand())
    ) {
      await pb.build();
      pb.copyTo();
    }
  }

  private async devWatch() {
    const watchPaths = [
      "./data/filters",
      "./packs",
      "../packages",
    ];

    const exec = () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(async () => {
        await this.run();
        this.logger.info("Rebuilt due to file change");
      }, 200);
    };

    await this.run();
    this.logger.info("Dev watch started");

    // Use a single watcher for all paths to avoid repeated calls
    const watcher = Deno.watchFs(watchPaths, { recursive: true });
    for await (const _event of watcher) {
      exec();
    }
  }

  private isHelpCommand(): boolean {
    return this.args.includes("--help") || this.args.includes("-h");
  }

  private isBuildCommand(): boolean {
    return this.args.includes("--build");
  }

  private isPacksCommand(): boolean {
    return this.args.includes("--packs");
  }

  private isCleanCommand(): boolean {
    return this.args.includes("--clean");
  }

  private isDevWatchCommand(): boolean {
    return this.args.includes("--dev");
  }
}

export { AxethCore };
