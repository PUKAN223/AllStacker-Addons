import chalk from "chalk";
import { Logger } from "./Logger.ts";
import { FileManagers } from "./FileManagers.ts";

type FilterCache = Record<string, { distSig: string }>;

class Filters {
  private name: string;
  public basePath: string = "./data/dist";
  public fileManagers: FileManagers;
  public log: string[];

  constructor(name: string, log: string[]) {
    this.name = name;
    this.fileManagers = new FileManagers();
    this.log = log;
  }

  public getName(): string {
    return this.name;
  }

  public msg(message: string) {
    this.log.push(chalk.grey(message));
  }

  async apply(): Promise<void> {}
}

class FilterManagers {
  private filters: (typeof Filters)[] = [];
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  public registerFilter(filter: typeof Filters) {
    this.filters.push(filter);
  }

  public getFilters(): (typeof Filters)[] {
    return this.filters;
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
    await Deno.mkdir(p.split("/").slice(0, -1).join("/"), { recursive: true });
    await Deno.writeTextFile(p, JSON.stringify(v, null, 2));
  }

  // quick fingerprint: sum of (mtime,size) across files
  private async distFingerprint(distPath = "./data/dist"): Promise<string> {
    let m = 0;
    let s = 0;
    let c = 0;

    const walk = async (dir: string) => {
      for await (const e of Deno.readDir(dir)) {
        const p = `${dir}/${e.name}`;
        if (e.isDirectory) await walk(p);
        else if (e.isFile) {
          const st = await Deno.stat(p);
          m += st.mtime?.getTime() ?? 0;
          s += st.size;
          c++;
        }
      }
    };

    await walk(distPath);
    return `${c}:${m}:${s}`;
  }

  async applyFilters(): Promise<void> {
    this.logger.info("Applying filters...");

    const cachePath = "./data/.cache/filters.json";
    const cache = await this.readJson<FilterCache>(cachePath, {});

    // fingerprint ก่อนรัน (ถ้า dist เปลี่ยนจาก copy ก็จะเปลี่ยน)
    const distSig = await this.distFingerprint("./data/dist");

    for (const filter of this.filters) {
      const log: string[] = [];
      const filterName = filter.name;

      if (cache[filterName]?.distSig === distSig) {
        // ✅ skip
        console.log(
          `${" ".repeat(8)}• ${chalk.blue(filterName)}\n${" ".repeat(10)} ${
            chalk.black(1)
          }. ${chalk.grey("Skipped (cache hit)")}`,
        );
        continue;
      }

      const filterInstance = new filter(filterName, log);
      await filterInstance.apply();

      // cache update (หลัง apply เสร็จ dist อาจเปลี่ยน)
      const newSig = await this.distFingerprint("./data/dist");
      cache[filterName] = { distSig: newSig };

      const logDisplay = log.map((x, i) =>
        `\n${" ".repeat(10)} ${chalk.black(i + 1)}. ${x}`
      );
      if (log.length > 0) {
        console.log(
          `${" ".repeat(8)}• ${chalk.blue(filterInstance.getName())}${
            logDisplay.join(",")
          }`,
        );
      }
    }

    await this.writeJson(cachePath, cache);
  }
}

export { FilterManagers, Filters };
