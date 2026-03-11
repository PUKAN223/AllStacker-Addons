import { FileManagers } from "@axeth/core";
import { ItemBuilderManager } from "./ItemBuilderManager.ts";
import { Logger } from "@axeth/core";
import * as path from "@std/path";
import "colors";

class AxethBuilder {
  private fileManager = new FileManagers();
  private distPath = path.join(
    Deno.cwd(),
    "data",
    "dist",
  );
  private logger = new Logger();
  public itemBuilderManager: ItemBuilderManager = new ItemBuilderManager();

  constructor() {}

  public onBuild() {}

  public async build(): Promise<void> {
    this.onBuild();
    const buildItems = [];
    for (const item of this.itemBuilderManager.getItemBuilders()) {
      const filePath = this.distPath + "/BP/items/" + item.basePath;
      await this.fileManager.writeFile(
        filePath,
        JSON.stringify(item.toJson(), null, 2),
      );
      buildItems.push(item.name);
    }
    this.logger.info(
      `Built ${buildItems.length} items: ${
        buildItems
          .map((x) => ` ${x} `.bgYellow)
          .join(" ")
      }`,
    );
  }
}

export { AxethBuilder };
