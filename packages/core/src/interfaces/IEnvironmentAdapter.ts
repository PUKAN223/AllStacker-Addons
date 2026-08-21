export interface IEnvironmentAdapter {
  getCwd(): string;
  getEnv(key: string): string | undefined;
  getArgs(): string[];
  exit(code?: number): never;
  watchFs(paths: string | string[], options?: { recursive?: boolean }): AsyncIterable<any>;
}
