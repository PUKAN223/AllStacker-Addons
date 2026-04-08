import { Player, ShutdownEvent, StartupEvent, WorldLoadAfterEvent } from "npm:@minecraft/server@2.3.0";
import { Logger } from "./Logger.ts";
import { PluginLoader } from "../../kisux3/configs/PluginLoader.ts";
import { PageBuilder } from "./PageBuilders.ts";

class PluginBase {
  public name: string
  public description: string
  public version: string
  public logger: Logger

  constructor(name: string, description: string, version: string) {
    this.name = name;
    this.description = description;
    this.version = version;
    this.logger = Logger.getInstance();
  }
  public getConfig(): { [key: string]: unknown } {
    const plugin = PluginLoader.find(plugin => plugin.name === this.name);
    if (!plugin) return {};
    return plugin.setting.config;
  }
  public getName(): string {
    return this.name;
  }
  public onLoad(ev?: WorldLoadAfterEvent) { void ev; }
  public onStartup(ev: StartupEvent) { void ev; }
  public onShutdown(ev: ShutdownEvent) { void ev; }
  public addConfig(pl: Player, page: PageBuilder, showUI: boolean = true): boolean {
    pl;
    page;
    showUI;
    return false;
  }
}

export { PluginBase }