export function parseArgs(args: string[]): [Record<string, unknown>, ...string[]] {
  try {
    const settings = JSON.parse(args[0] || "{}");
    return [settings, ...args.slice(1)];
  } catch {
    return [{}, ...args];
  }
}
