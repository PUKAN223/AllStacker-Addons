import type { ConfigOptions } from  "@packages/core/src/types/ConfigOptions.ts";
import type { IFileSystemAdapter } from  "@packages/core/src/interfaces/IFileSystemAdapter.ts";
import type { IArchiveAdapter } from "../interfaces/IArchiveAdapter.ts";
import type { IImageOptimizerAdapter } from "../interfaces/IImageOptimizerAdapter.ts";
import type { ILoggerAdapter } from "../interfaces/ILoggerAdapter.ts";
import type { IEnvironmentAdapter } from "../interfaces/IEnvironmentAdapter.ts";

export interface PackBuilderOptions {
  packsPath?: string;
  distPath?: string;
  name: string;
  config: ConfigOptions;
  fsAdapter?: IFileSystemAdapter;
  loggerAdapter?: ILoggerAdapter;
  archiveAdapter?: IArchiveAdapter;
  imageOptimizerAdapter?: IImageOptimizerAdapter;
  envAdapter?: IEnvironmentAdapter;
}
