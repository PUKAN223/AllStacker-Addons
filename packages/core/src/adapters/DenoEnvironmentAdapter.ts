import type { IEnvironmentAdapter } from "../interfaces/IEnvironmentAdapter.ts";

export class DenoEnvironmentAdapter implements IEnvironmentAdapter {
  getCwd(): string {
    return Deno.cwd();
  }

  getEnv(key: string): string | undefined {
    return Deno.env.get(key);
  }

  getArgs(): string[] {
    return Deno.args;
  }

  exit(code?: number): never {
    Deno.exit(code);
  }

  watchFs(paths: string | string[], options?: { recursive?: boolean }): AsyncIterable<any> {
    return Deno.watchFs(paths, options);
  }
}

