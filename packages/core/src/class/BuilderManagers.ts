import * as path from "@std/path";

type BuilderMod = { default: new () => { build: () => Promise<void> } };

class BuilderManagers {
  private builderUrl: URL;

  // optional cache (useful in non-dev)
  private cachedCtor: (BuilderMod["default"]) | null = null;

  constructor() {
    const builderPath = path.join(
      Deno.cwd(),
      "packs",
      "config",
      "builders",
      "index.ts",
    );
    this.builderUrl = path.toFileUrl(builderPath);
  }

  async buildPack(): Promise<void> {
    const isDev = Deno.args.includes("--dev"); // หรืออ่านจาก config/env

    // ✅ prod: reuse ctor (fast)
    if (!isDev && this.cachedCtor) {
      await new this.cachedCtor().build();
      return;
    }

    // ✅ dev: bust module cache so it reloads changed code
    const url = new URL(this.builderUrl.href);
    if (isDev) url.searchParams.set("t", String(Date.now()));

    const mod = (await import(url.href)) as BuilderMod;

    if (!isDev) this.cachedCtor = mod.default;

    await new mod.default().build();
  }
}

export { BuilderManagers };
