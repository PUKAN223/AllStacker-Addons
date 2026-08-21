import chalk from "chalk";
import * as prompts from "@clack/prompts";
import { ConfigManagers } from "@packages/core/src/class/ConfigManagers.ts";
import { Logger } from "@packages/core/src/class/Logger.ts";
import { PackBuilder } from "@packages/core/src/class/PackBuilders.ts";
import { DenoFileSystemAdapter } from "@packages/core/src/adapters/DenoFileSystemAdapter.ts";
import { ChalkLoggerAdapter } from "@packages/core/src/adapters/ChalkLoggerAdapter.ts";
import { JSZipArchiveAdapter } from "@packages/core/src/adapters/JSZipArchiveAdapter.ts";
import { SharpOptimizerAdapter } from "@packages/core/src/adapters/SharpOptimizerAdapter.ts";
import { FileManagers } from "@packages/core/src/class/FileManagers.ts";
import { DenoEnvironmentAdapter } from "@packages/core/src/adapters/DenoEnvironmentAdapter.ts";
// import type { IEnvironmentAdapter } from "@packages/core/src/interfaces/IEnvironmentAdapter.ts";
// import type { ILoggerAdapter } from "@packages/core/src/interfaces/ILoggerAdapter.ts";
// import type { IFileSystemAdapter } from "@packages/core/src/interfaces/IFileSystemAdapter.ts";

class AxethCore {
  private args: string[];
  private fsAdapter = new DenoFileSystemAdapter();
  private loggerAdapter = new ChalkLoggerAdapter();
  private envAdapter = new DenoEnvironmentAdapter();
  private logger = new Logger(this.loggerAdapter);
  private fileManagers = new FileManagers(this.fsAdapter);
  private archiveAdapter = new JSZipArchiveAdapter();
  private imageOptimizerAdapter = new SharpOptimizerAdapter();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(args?: string[]) {
    this.args = args || this.envAdapter.getArgs();

    if (this.isDevWatchCommand()) {
      this.devWatch();
    } else {
      this.run();
    }
  }

  private async run() {
    console.log("\x1Bc"); // Clear terminal
    console.clear();

    const configManagers = new ConfigManagers(this.fileManagers, this.logger);
    const config = await configManagers.getConfig();
    this.logger.debug(
      `Loaded config pack: ${config.meta.name}@${
        config.meta.version.join(".")
      }`,
    );

    const pb = new PackBuilder({
      name: config.meta.name,
      config,
      fsAdapter: this.fsAdapter,
      loggerAdapter: this.loggerAdapter,
      envAdapter: this.envAdapter,
      archiveAdapter: this.archiveAdapter,
      imageOptimizerAdapter: this.imageOptimizerAdapter,
    });

    if (this.isHelpCommand()) {
      this.logger.msg(
        "bun run index.js [--build] [--packs] [--clean] [--dev:watch]",
        "Usage",
        chalk.bgHex("#808080"),
      );
      this.envAdapter.exit(0);
    }

    if (this.isCleanCommand()) await pb.clean();
    if (this.isBuildCommand()) {
      await pb.build();
      await pb.copyTo();
      return;
    }

    if (this.isPacksCommand()) {
      await pb.build();
      const shouldOptimize = await prompts.confirm({
        message: "Optimize images and minify JSON before packing?",
        initialValue: true,
      });
      if (!prompts.isCancel(shouldOptimize) && shouldOptimize) {
        await pb.optimize();
      }
      await pb.pack();
      return;
    }

    if (this.isOptimizeCommand()) await pb.optimize();

    if (
      !(this.isBuildCommand() || this.isCleanCommand() ||
        this.isOptimizeCommand())
    ) {
      await pb.build();
      await pb.copyTo();
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
        this.logger.debug("Rebuilt due to file change");
      }, 200);
    };

    await this.run();
    this.logger.success("Dev watch started");

    // Use a single watcher for all paths to avoid repeated calls
    const watcher = this.envAdapter.watchFs(watchPaths, { recursive: true });
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

  private isOptimizeCommand(): boolean {
    return this.args.includes("--optimize");
  }

  private isDevWatchCommand(): boolean {
    return this.args.includes("--dev");
  }
}

export { AxethCore };
