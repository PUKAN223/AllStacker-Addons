import type { ChalkInstance } from "chalk";
import type { ILoggerAdapter } from  "@packages/core/src/interfaces/ILoggerAdapter.ts";
import { ChalkLoggerAdapter } from  "@packages/core/src/adapters/ChalkLoggerAdapter.ts";

class Logger {
  private adapter: ILoggerAdapter;

  constructor(adapter?: ILoggerAdapter) {
    this.adapter = adapter || new ChalkLoggerAdapter();
  }

  public msg(message: string, type: string, _color: ChalkInstance) {
    // We pass undefined for colorHex since the new adapter interface
    // accepts hex strings, but we maintain the signature for backward compatibility.
    // Ideally, consumers should be updated to use the adapter directly.
    this.adapter.msg(message, type);
  }

  public info(message: string) {
    this.adapter.info(message);
  }

  public error(message: string) {
    this.adapter.error(message);
  }

  public success(message: string) {
    this.adapter.success(message);
  }

  public debug(message: string) {
    this.adapter.debug(message);
  }

  public process(message: string) {
    this.adapter.process(message);
  }
}

export { Logger };
