import chalk, { type ChalkInstance } from "chalk";
import type { ILoggerAdapter } from  "@packages/core/src/interfaces/ILoggerAdapter.ts";

export class ChalkLoggerAdapter implements ILoggerAdapter {
  private prefix(type: string, color: ChalkInstance) {
    return color(` ${type} `) + `:`;
  }

  public msg(message: string, type: string, colorHex?: string) {
    const color = colorHex ? chalk.bgHex(colorHex) : chalk.bgGrey;
    const prefix = this.prefix(type.toUpperCase(), color);
    console.log(`${prefix} ${chalk.grey(message)}`);
  }

  public info(message: string) {
    const prefix = this.prefix("INFO", chalk.bgBlue);
    console.log(`${prefix} ${chalk.grey(message)}`);
  }

  public error(message: string) {
    const prefix = this.prefix("ERROR", chalk.bgRed);
    console.log(`${prefix} ${chalk.grey(message)}`);
  }

  public success(message: string) {
    const prefix = this.prefix("SUCCESS", chalk.bgGreen);
    console.log(`${prefix} ${chalk.grey(message)}`);
  }

  public debug(message: string) {
    if (Deno.args.includes("--dev")) {
      const prefix = this.prefix("DEBUG", chalk.bgHex("#ff96ffff"));
      console.log(`${prefix} ${chalk.grey(message)}`);
    }
  }

  public process(message: string) {
    const prefix = this.prefix("PROCESS", chalk.bgHex("#FFFF00"));
    console.log(`${prefix} ${chalk.grey(message)}`);
  }
}
