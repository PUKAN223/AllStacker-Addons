import chalk from "chalk";
import { Logger } from "@packages/core/src/class/Logger.ts";
import { FileManagers } from "@packages/core/src/class/FileManagers.ts";

class Filters {
  private name: string;
  public basePath: string = "./data/dist";
  public fileManagers: FileManagers;
  public log: string[];

  constructor(name: string, log: string[], fileManagers?: FileManagers) {
    this.name = name;
    this.fileManagers = fileManagers || new FileManagers();
    this.log = log;
  }

  public getName(): string {
    return this.name;
  }

  public msg(message: string) {
    this.log.push(chalk.grey(`    • ${message}`));
  }

  async apply(): Promise<void> {}
}

// ---------------------------------------------------------------------------

class FilterManagers {
  private filters: (typeof Filters)[] = [];
  private logger: Logger;
  private fileManagers: FileManagers;

  constructor(logger?: Logger, fileManagers?: FileManagers) {
    this.logger = logger || new Logger();
    this.fileManagers = fileManagers || new FileManagers();
  }

  public registerFilter(filter: typeof Filters): void {
    this.filters.push(filter);
  }

  public getFilters(): (typeof Filters)[] {
    return this.filters;
  }

  /**
   * Apply all registered filters sequentially.
   */
  async applyFilters(): Promise<void> {
    // this.logger.info("Applying filters...");

    for (const FilterClass of this.filters) {
      const log: string[] = [];
      const instance = new FilterClass(
        FilterClass.name,
        log,
        this.fileManagers,
      );

      await instance.apply();

      if (log.length > 0) {
        // Print the logs that were collected by the filter during apply()
        for (const message of log) {
          console.log(message);
        }
      }
    }
  }
}

export { FilterManagers, Filters };
