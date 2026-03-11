import type { ItemBuilder } from "@axeth/builder";

class ItemBuilderManager {
  private itemBuilders: Map<string, ItemBuilder>;

  constructor() {
    this.itemBuilders = new Map<string, ItemBuilder>();
  }

  public registerItemBuilder(itemBuilder: typeof ItemBuilder, path?: string) {
    const instance = new itemBuilder();
    if (!path) {
      path = instance.basePath;
    }
    this.itemBuilders.set(path, instance);
  }

  public getItemBuilder(path: string): ItemBuilder | undefined {
    return this.itemBuilders.get(path);
  }

  public getItemBuilders(): ItemBuilder[] {
    return Array.from(this.itemBuilders.values());
  }

  public unregisterItemBuilder(path: string): void {
    this.itemBuilders.delete(path);
  }
}

export { ItemBuilderManager };
