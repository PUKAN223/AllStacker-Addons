import * as path from "@std/path";

import type { FileManagers } from "./FileManagers.ts";
import type { Logger } from "./Logger.ts";

import type { IEnvironmentAdapter } from "../interfaces/IEnvironmentAdapter.ts";

type BuilderMod = { default: new (fileManagers?: FileManagers, logger?: Logger) => { build: () => Promise<void> } };

class BuilderManagers {
  private builderUrl: URL;
  private fileManagers: FileManagers;
  private logger: Logger;
  private envAdapter: IEnvironmentAdapter;

  constructor(fileManagers: FileManagers, logger: Logger, envAdapter: IEnvironmentAdapter) {
    this.fileManagers = fileManagers;
    this.logger = logger;
    this.envAdapter = envAdapter;
    const builderPath = path.join(
      this.envAdapter.getCwd(),
      "packs",
      "config",
      "builders",
      "index.ts",
    );
    this.builderUrl = path.toFileUrl(builderPath);
  }

  async buildPack(): Promise<void> {
    const isDev = this.envAdapter.getArgs().includes("--dev"); // หรืออ่านจาก config/env

    // ✅ dev: bust module cache so it reloads changed code
    const url = new URL(this.builderUrl.href);
    if (isDev) url.searchParams.set("t", String(Date.now()));

    const mod = (await import(url.href)) as BuilderMod;

    try {
      await new mod.default(this.fileManagers, this.logger).build();
    } catch (e) {
      if (e instanceof TypeError && e.message.includes("constructor")) {
        // Fallback if the user's builder doesn't accept arguments or isn't a class
        this.logger.error(`Error instantiating builder: ${e.message}`);
      } else {
        throw e;
      }
    }
  }
}

export { BuilderManagers };
