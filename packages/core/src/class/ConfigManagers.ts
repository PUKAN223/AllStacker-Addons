import type { ConfigOptions } from  "@packages/core/src/types/ConfigOptions.ts";
import { FileManagers } from  "@packages/core/src/class/FileManagers.ts";
import { Logger } from  "@packages/core/src/class/Logger.ts";

class ConfigManagers {
  private fileManagers: FileManagers;
  private configPath: string = "./packs/config.json";
  private logger: Logger;

  constructor(fileManagers?: FileManagers, logger?: Logger) {
    this.fileManagers = fileManagers || new FileManagers();
    this.logger = logger || new Logger();
  }

  public async getConfig(): Promise<ConfigOptions> {
    const config: ConfigOptions = JSON.parse(
      (await this.fileManagers.readFile(this.configPath)).toString(),
    );

    return config;
  }

  public saveConfig(config: ConfigOptions) {
    this.fileManagers.writeFile(
      this.configPath,
      JSON.stringify(config, null, 4),
    );
    this.logger.success("Config saved successfully.");
  }
}

export { ConfigManagers };
