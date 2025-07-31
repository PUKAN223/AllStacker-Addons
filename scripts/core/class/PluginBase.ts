import { Player, ShutdownBeforeEventSignal, ShutdownEvent, StartupBeforeEventSignal, StartupEvent, WorldLoadAfterEvent } from "@minecraft/server";
import { Logger } from "./Logger";
import { PluginLoader } from "../../kisux3/configs/PluginLoader";
import { PageBuilder } from "./PageBuilders";

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
  public getConfig(): { [key: string]: any } {
    const plugin = PluginLoader.find(plugin => plugin.name === this.name);
    if (!plugin) return {};
    return plugin.setting.config;
  }
  public getName(): string {
    return this.name;
  }
  public onLoad(ev?: WorldLoadAfterEvent) { }
  public onStartup(ev: StartupEvent) { }
  public onShutdown(ev: ShutdownEvent) { }
  public addConfig(pl: Player, page: PageBuilder, showUI: boolean = true): boolean {
    return false;
  }
}

export { PluginBase }