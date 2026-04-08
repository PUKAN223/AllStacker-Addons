import { Filters } from "@kisu/cli";
import { Manifest } from "./types/Manifest.ts";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@0.11.1";
import { resolve } from "jsr:@std/path@1.1.2";
import * as esbuild from "npm:esbuild@0.25.11";
import { parseArgs } from "./utils/parseArgs.ts";
import chalk from "jsr:@nothing628/chalk@1.0.1";

const [settings] = parseArgs(Deno.args);
const configPath = resolve("./deno.json");

class TSBuilds extends Filters {
  private typescript = "ts";
  private bpPath = `${this.basePath}/BP`;

  override async apply(): Promise<void> {
    const manifest = this.readManifest(this.bpPath);
    if (!manifest) return;
    const entryPath = manifest.modules.find((x) => x.entry)?.entry;
    if (!entryPath) return;

    const scriptPath = "./packs" + "/" + entryPath.replace(".js", `.${this.typescript}`);
    
    // Run linter before building
    this.msg(`Running linter: ${chalk.yellow("deno lint")}`);
    const lintProcess = new Deno.Command("deno", {
      args: ["lint", "./packs", "./lib"],
      stdout: "piped",
      stderr: "piped",
    });
    
    const lintResult = await lintProcess.output();
    
    if (!lintResult.success) {
      const errorOutput = new TextDecoder().decode(lintResult.stderr);
      console.error(errorOutput);
      this.msg(`${chalk.red("✗")} Linting failed. Fix errors before building.`);
      return;
    }
    
    this.msg(`${chalk.green("✓")} Linting passed`);
    
    // Build KisuLib.js first (contains @kisu/api)
    this.msg(`Building library: ${chalk.blue("KisuLib.js")}`);
    await esbuild.build({
      plugins: denoPlugins({ configPath }) as esbuild.Plugin[],
      bundle: true,
      entryPoints: ["./lib/@kisu/api/index.ts"],
      external: [
        "@minecraft/server",
        "@minecraft/server-ui",
      ],
      format: "esm",
      outfile: this.bpPath + "/scripts/KisuLib.js",
      minify: true,
      keepNames: false,
      sourcemap: true,
      ...settings,
    }).then(() => {
      this.msg(`Successfully built library: ${chalk.green("BP/scripts/KisuLib.js")}`);
    });

    // Build main script (excludes @kisu/api)
    this.msg(`Building script: ${chalk.green(scriptPath)}`);
    await esbuild.build({
      plugins: [
        {
          name: "alias-kisu-api",
          setup(build) {
            build.onResolve({ filter: /^@kisu\/api$/ }, () => {
              return { path: "./KisuLib.js", external: true };
            });
          },
        },
        ...denoPlugins({ configPath }) as esbuild.Plugin[],
      ],
      bundle: true,
      entryPoints: [
        scriptPath,
      ],
      external: [
        "@minecraft/server",
        "@minecraft/server-ui",
      ],
      format: "esm",
      outfile: this.bpPath + "/" + entryPath,
      sourcemap: true,
      ...settings,
    }).then(() => {
      this.msg(`Successfully built script: ${chalk.green("BP/" + entryPath)}`);
    });

    // this.fileManagers.removeDirectory(this.basePath + "/" + "scripts");
  }

  public readManifest(bpPath: string): Manifest | null {
    try {
      return JSON.parse(
        Deno.readTextFileSync(`${bpPath}/manifest.json`),
      ) as Manifest;
    } catch {
      return null;
    }
  }
}

export { TSBuilds };
