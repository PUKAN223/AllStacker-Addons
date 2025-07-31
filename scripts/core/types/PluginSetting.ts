import { PluginBase } from "../class/PluginBase"

export default interface PluginSetting {
  name: string,
  description: string,
  version: string,
  main: PluginBase,
  setting: {
    enabled: boolean,
    config: { [key: string]: any }
  }
}