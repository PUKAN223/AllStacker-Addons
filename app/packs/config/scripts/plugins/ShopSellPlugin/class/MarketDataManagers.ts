import { PluginBase } from "@axeth/api";
import type {
  MarketConfig,
  MarketData,
  MarketNPCData,
} from "../types/MarketData.ts";

class MarketDataManagers {
  private plugin: PluginBase;

  constructor(plugin: PluginBase) {
    this.plugin = plugin;
  }

  get data() {
    return JSON.parse(
      this.plugin.config.get()["marketData"]?.value as string,
    ) as MarketNPCData;
  }

  get size(): number {
    return Object.keys(this.data).length;
  }

  public getNPCMarketData(marketId: string): MarketNPCData[string] | null {
    const data = this.data;
    return data[marketId] || null;
  }

  public setNPCMarketData(marketId: string, data: Partial<MarketData>): void {
    const currentData = this.data;
    currentData[marketId] = {
      ...currentData[marketId],
      ...data,
    } as MarketData;
    this.updateMarketData(currentData);
    return;
  }

  public addItemToMarket(
    marketId: string,
    itemData: MarketData["items"][number],
  ): MarketNPCData {
    const currentData = this.data;
    currentData[marketId]!.items.push(itemData);
    this.updateMarketData(currentData);
    return currentData;
  }

  public removeItemFromMarket(
    marketId: string,
    itemIndex: number,
  ): MarketNPCData {
    const currentData = this.data;
    currentData[marketId]!.items.splice(itemIndex, 1);
    this.updateMarketData(currentData);
    return currentData;
  }

  public editItemInMarket(
    marketId: string,
    itemIndex: number,
    itemData: Partial<MarketData["items"][number]>,
  ): MarketNPCData {
    const currentData = this.data;
    currentData[marketId]!.items[itemIndex] = {
      ...currentData[marketId]!.items[itemIndex],
      ...itemData,
    } as MarketData["items"][number];
    this.updateMarketData(currentData);
    return currentData;
  }

  public addTransactionToMarketHistory(
    marketId: string,
    transactionData: MarketData["history"][number],
  ): MarketNPCData {
    const currentData = this.data;
    currentData[marketId]!.history.push(transactionData);

    // Limit to max 60 transactions, remove oldest ones
    if (currentData[marketId]!.history.length > 60) {
      currentData[marketId]!.history = currentData[marketId]!.history
        .sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first
        .slice(0, 60); // Keep only the 60 most recent
    }

    this.updateMarketData(currentData);
    return currentData;
  }

  public getMarketHistory(marketId: string): MarketData["history"] {
    const currentData = this.data;
    return currentData[marketId]!.history;
  }

  public clearMarketHistory(marketId: string): MarketNPCData {
    const currentData = this.data;
    currentData[marketId]!.history = [];
    this.updateMarketData(currentData);
    return currentData;
  }

  public removeOldTransactionsByItemId(
    marketId: string,
    itemId: string,
  ): MarketNPCData {
    const currentData = this.data;
    currentData[marketId]!.history = currentData[marketId]!.history.filter(
      (transaction) => transaction.itemId !== itemId,
    );
    this.updateMarketData(currentData);
    return currentData;
  }

  public removeOldTransactionsByDays(
    marketId: string,
    daysOld: number = 30,
  ): MarketNPCData {
    const currentData = this.data;
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

    currentData[marketId]!.history = currentData[marketId]!.history.filter(
      (transaction) => transaction.timestamp > cutoffTime,
    );

    this.updateMarketData(currentData);
    return currentData;
  }

  public enforceTransactionLimit(marketId: string): MarketNPCData {
    const currentData = this.data;
    if (currentData[marketId]!.history.length > 60) {
      currentData[marketId]!.history = currentData[marketId]!.history
        .sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first
        .slice(0, 60); // Keep only the 60 most recent
    }
    this.updateMarketData(currentData);
    return currentData;
  }

  public enforceTransactionLimitForAllMarkets(): MarketNPCData {
    const currentData = this.data;

    for (const marketId in currentData) {
      if (currentData[marketId]!.history.length > 60) {
        currentData[marketId]!.history = currentData[marketId]!.history
          .sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first
          .slice(0, 60); // Keep only the 60 most recent
      }
    }

    this.updateMarketData(currentData);
    return currentData;
  }

  public initializeNpcMarketData(
    marketId: string,
    config: MarketConfig,
  ): MarketNPCData {
    const currentData = this.data;
    if (currentData[marketId]) return currentData;
    currentData[marketId] = {
      items: [],
      history: [],
      config: config,
    };
    this.updateMarketData(currentData);
    return currentData;
  }

  private updateMarketData(data: MarketNPCData): void {
    const marketDataString = JSON.stringify(data);
    const configData = this.plugin.config.get();
    configData["marketData"]!.value = marketDataString;
    this.plugin.config.set(configData);
    return;
  }
}

export { MarketDataManagers };
