import { PluginBase } from "@axeth/api";
import type { WalletProfile } from "./WalletManager.ts";

interface WalletProfileStore {
  [key: string]: WalletProfile;
}

class WalletProfileDataManager {
  private plugin: PluginBase;

  constructor(plugin: PluginBase) {
    this.plugin = plugin;
  }

  private getStore(): WalletProfileStore {
    const raw = this.plugin.config.get()["walletProfile"]?.value;
    if (typeof raw !== "string" || raw.trim().length === 0) return {};

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed as WalletProfileStore;
      }
    } catch {
      // Ignore invalid json and fallback to empty store
    }

    return {};
  }

  private setStore(store: WalletProfileStore) {
    const config = this.plugin.config.get();
    config["walletProfile"]!.value = JSON.stringify(store);
    this.plugin.config.set(config);
  }

  public get(playerId: string) {
    const store = this.getStore();
    return store[playerId];
  }

  public set(playerId: string, profile: WalletProfile) {
    const store = this.getStore();
    store[playerId] = profile;
    this.setStore(store);
  }
}

export { WalletProfileDataManager };
