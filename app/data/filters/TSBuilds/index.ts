import { Filters } from "@axeth/core";
import type { Manifest } from "./types/Manifest.ts";
import { parseArgs } from "./utils/parseArgs.ts";
import { denoPlugins } from "@luca/esbuild-deno-loader";
import esbuild from "esbuild";
import chalk from "chalk";
import * as path from "@std/path";

const configPath = path.resolve("../deno.json");
const [settings] = parseArgs(Deno.args.slice(2));

class TSBuilds extends Filters {
  private typescript = "ts";
  private bpPath = `${this.basePath}/BP`;
  private appPath = path.resolve(this.basePath, "..", "..");
  private workspacePath = path.resolve(this.appPath, "..");

  override async apply(): Promise<void> {
    const manifest = await this.readManifest(this.bpPath);
    if (!manifest) return;
    const entryPath = manifest.modules.find((x) => x.entry)?.entry;
    if (!entryPath) return;

    const scriptPath = path.join(
      this.appPath,
      "packs",
      "config",
      entryPath.replace(".js", `.${this.typescript}`),
    );

    const lintOk = await this.runLinter();
    if (!lintOk) {
      this.msg(`Stopping build due to lint errors`);
      return;
    }
    await this.runBuildLib();
    await this.runBuildScripts(scriptPath, entryPath);
  }

  private async runBuildScripts(scriptPath: string, entryPath: string) {
    try {
      await esbuild.build({
        plugins: [
          {
            name: "alias-axeth-api",
            setup(build) {
              build.onResolve({ filter: /^@axeth\/api$/ }, () => {
                return { path: "./AxethLib.js", external: true };
              });
            },
          },
        ],
        bundle: true,
        entryPoints: [
          scriptPath,
        ],
        minify: true,
        external: [
          "@minecraft/server",
          "@minecraft/server-ui",
        ],
        format: "esm",
        outfile: this.bpPath + "/" + entryPath,
        sourcemap: true,
        ...settings,
      });
      this.msg(`Successfully built script: ${chalk.green("BP/" + entryPath)}`);
    } catch (e) {
      this.msg(chalk.red("esbuild failed for scripts:"));
      this.msg(this.extractUsefulErrors(String(e)));
    }
  }

  private async runBuildLib() {
    try {
      await esbuild.build({
        bundle: true,
        entryPoints: ["@axeth/api"],
        external: [
          "@minecraft/server",
          "@minecraft/server-ui",
        ],
        format: "esm",
        outfile: this.bpPath + "/scripts/AxethLib.js",
        minify: true,
        keepNames: false,
        sourcemap: true,
        plugins: denoPlugins({ configPath: configPath }) as esbuild.Plugin[],
        ...settings,
      });
      this.msg(
        `Successfully built library: ${chalk.green("BP/scripts/AxethLib.js")}`,
      );
    } catch (e) {
      this.msg(chalk.red("esbuild failed for library:"));
      this.msg(this.extractUsefulErrors(String(e)));
    }
  }

  private countCheckedFiles(out: string): number {
    // deno check มักพ่น "Check <path>" ต่อบรรทัด
    // นับจำนวนบรรทัดที่ขึ้นต้นด้วย "Check "
    return out
      .split(/\r?\n/)
      .filter((l) => l.startsWith("Check "))
      .length;
  }

  private extractUsefulErrors(out: string): string {
    // ตัด output ให้ไม่ยาวเกิน (กัน spam)
    const lines = out.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const max = 200;
    if (lines.length <= max) return lines.join("\n");
    return lines.slice(0, max).join("\n") +
      `\n... (${lines.length - max} more lines)`;
  }

  private async runLinter(): Promise<boolean> {
    try {
      // -------- lint --------
      const lintCommand = new Deno.Command("deno", {
        args: ["lint", "--ignore=**/dist/**,**/node_modules/**", "packs/"],
        cwd: this.appPath,
        stdout: "piped",
        stderr: "piped",
      });

      const lintOutput = await lintCommand.output();
      const lintStdout = new TextDecoder().decode(lintOutput.stdout);
      const lintStderr = new TextDecoder().decode(lintOutput.stderr);

      if (!lintOutput.success) {
        // ❌ error only: โชว์รายละเอียดเต็ม (แต่ตัดไม่ให้โคตรยาว)
        const detail = this.extractUsefulErrors(
          [lintStdout, lintStderr].filter(Boolean).join("\n"),
        );
        this.msg(chalk.red("Lint failed"));
        if (detail.trim()) this.msg(detail);
        return false;
      } else {
        // ✅ ผ่าน: ไม่ต้องโชว์ stdout/stderr
        this.msg(`Lint passed ${chalk.blue("./packs")}`);
      }

      // -------- type-check --------
      const checkCommand = new Deno.Command("deno", {
        args: ["check", "packs/**/*.ts"],
        cwd: this.appPath,
        stdout: "piped",
        stderr: "piped",
      });

      const checkOutput = await checkCommand.output();
      const checkStdout = new TextDecoder().decode(checkOutput.stdout);
      const checkStderr = new TextDecoder().decode(checkOutput.stderr);

      if (!checkOutput.success) {
        // ❌ error only: โชว์รายละเอียด
        const detail = this.extractUsefulErrors(
          [checkStdout, checkStderr].filter(Boolean).join("\n"),
        );
        this.msg(chalk.red("Type-check failed"));
        if (detail.trim()) this.msg(detail);
        return false;
      }

      // ✅ ผ่าน: สรุปจำนวนไฟล์ที่โดน check (จาก stdout)
      const n = this.countCheckedFiles(checkStdout);
      this.msg(
        `Checked ${chalk.yellow(String(n))} files, type-check passed ${
          chalk.blue("./packs")
        }`,
      );
      return true;
    } catch (error) {
      this.msg(`Linter unavailable: ${error}`);
      this.msg(
        `Continuing because direct deno lint/check may still be run outside the filter.`,
      );
      return true;
    }
  }

  public async readManifest(bpPath: string): Promise<Manifest | null> {
    try {
      return JSON.parse(
        await Deno.readTextFile(`${bpPath}/manifest.json`),
      ) as Manifest;
    } catch {
      return null;
    }
  }
}
//
export { TSBuilds };
