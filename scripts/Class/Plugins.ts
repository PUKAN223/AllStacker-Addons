import { world } from "@minecraft/server";

export default class Plugins {
  private pluginName: string
  constructor(name: string) {
    this.pluginName = name;
  }

  public setup() {
  }

  public init() {
  }
}