import { ConfigOptions, FileManagers, Logger } from "@kisu/cli";

class ConfigManagers {
  private fileManagers: FileManagers;
  private configPath: string = "./packs/config.json";
  private logger: Logger;

  constructor() {
    this.fileManagers = new FileManagers();
    this.logger = new Logger();
  }

  public getConfig() {
    const config: ConfigOptions = JSON.parse(
      this.fileManagers.readFile(this.configPath).toString(),
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
