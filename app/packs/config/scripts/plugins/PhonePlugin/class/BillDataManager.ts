import { PluginBase } from "@axeth/api";
import { BillData } from "../types/BillData.ts";

class BillDataManager {
  private plugin: PluginBase;

  constructor(plugin: PluginBase) {
    this.plugin = plugin;
  }

  get data() {
    console.warn(JSON.stringify(this.plugin.config.get()["bankBill"].value));
    return JSON.parse(
      this.plugin.config.get()["bankBill"].value as string,
    ) as BillData;
  }

  public getBills(): BillData {
    return this.data;
  }

  public getBillData(playerId: string): BillData[string] {
    return this.data[playerId] ?? [];
  }

  public addBill(playerId: string, bill: BillData[string][number]) {
    const current = this.data;
    current[playerId] = [...(current[playerId] ?? []), bill];
    this.updateData(current);
  }

  public removeBill(playerId: string, billId: number) {
    const current = this.data;
    current[playerId] = current[playerId]?.filter((b) => b.id !== billId);
    this.updateData(current);
  }

  public clearBills(playerId: string) {
    const current = this.data;
    current[playerId] = [];
    this.updateData(current);
  }

  public updateData(data: BillData) {
    const config = this.plugin.config.get();
    config["bankBill"].value = JSON.stringify(data);
    this.plugin.config.set(config);
  }
}

export { BillDataManager };
