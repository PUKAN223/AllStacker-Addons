import { PluginBase } from "@axeth/api";

export interface FishingLootItem {
  itemId: string;
  icon: string;
  dropRate: number;
}

class FishingLootManager {
  private plugin: PluginBase;
  private constructor(plugin: PluginBase) {
    this.plugin = plugin;
  }

  public static initialize(plugin: PluginBase) {
    return new FishingLootManager(plugin);
  }

  get data(): string {
    return (
      (this.plugin.config.get()["fishingLoot"]!.value as string) ??
      this.plugin.getSettings()["fishingLoot"]!.default
    );
  }

  public getFishingLoot(): FishingLootItem[] {
    return JSON.parse(this.data) as FishingLootItem[];
  }

  public setFishingLoot(loot: FishingLootItem[]) {
    const config = this.plugin.config.get();
    config["fishingLoot"]!.value = JSON.stringify(loot);
    this.plugin.config.set(config);
  }

  public addFishingLoot(item: FishingLootItem) {
    const loot = this.getFishingLoot();
    loot.push(item);
    this.setFishingLoot(loot);
  }

  public removeFishingLoot(itemId: string) {
    const loot = this.getFishingLoot().filter((item) => item.itemId !== itemId);
    this.setFishingLoot(loot);
  }

  public clearFishingLoot() {
    this.setFishingLoot([]);
  }

  public pickRandomLoot(): FishingLootItem | null {
    const loot = this.getFishingLoot();
    const rand = Math.random() * 100;
    let cumulativeRate = 0;
    for (const item of loot) {
      cumulativeRate += item.dropRate;
      if (rand <= cumulativeRate) {
        return item;
      }
    }
    return null;
  }
}

export { FishingLootManager };
