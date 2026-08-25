import path from "node:path";
import templateData from  "@packages/template/data/templates.json" with { type: "json" };

type TemplateKey = { [key: string]: unknown };
type Spinner = {
  start: (message: string) => void;
  stop: (message: string) => void;
  message: (message: string) => void;
};

class Template {
  private workspaceDir: string;

  constructor(workspaceDir?: string) {
    this.workspaceDir = path.join(Deno.cwd(), workspaceDir || "");
  }

  public getFiles(): string[] {
    return Object.keys(templateData);
  }

  public getTemplate(name: keyof typeof templateData): string | null {
    return templateData[name] || null;
  }

  public getAllTemplates(): typeof templateData {
    return templateData;
  }

  public async generateTemplate(config: TemplateKey, spinner: Spinner) {
    spinner.start("Preparing template pack files...");

    const populatedTemplates = Object.entries(templateData).map(([filePath, fileContent]) => ({
      filePath,
      content: this.populateTemplate(fileContent, config)
    }));

    spinner.stop("Prepared template pack files.");
    spinner.start("Creating template pack files...");

    const targetDir = config["project_name"]
      ? path.join(this.workspaceDir, config["project_name"] as string)
      : this.workspaceDir;

    await Promise.all(
      populatedTemplates.map(async ({ filePath, content }) => {
        const shortPath = filePath.split("/").slice(-5).join("/");
        spinner.message(`Creating file: ${shortPath}`);
        await this.writeTemplateFile(path.join(targetDir, filePath), content);
      })
    );

    spinner.stop("Created template pack files.");
    await this.installDependencies(targetDir, [
      `jsr:@axeth/api@${config["axethApiVersion"]}`,
      `jsr:@axeth/core@${config["axethCoreVersion"]}`,
      `npm:@minecraft/server@${config["minecraftServerVersion"]}`,
      `npm:@minecraft/server-ui@${config["minecraftServerUIVersion"]}`,
    ], spinner);
  }

  private async installDependencies(
    targetDir: string,
    dependencies: string[],
    spinner: Spinner,
  ) {
    spinner.start("Installing dependencies...");
    spinner.message(`Installing ${dependencies.length} dependencies...`);

    const process = new Deno.Command("deno", {
      cwd: targetDir,
      args: ["add", ...dependencies],
      stdout: "piped",
      stderr: "piped",
    }).spawn();
    
    const { code, stderr } = await process.output();

    if (code === 0) {
      spinner.stop("Installed dependencies.");
    } else {
      const errorOutput = new TextDecoder().decode(stderr);
      spinner.stop("Failed to install dependencies.");
      throw new Error(
        `Error installing dependencies: ${errorOutput}`,
      );
    }
  }

  private async writeTemplateFile(filePath: string, content: string) {
    await Deno.mkdir(path.dirname(filePath), { recursive: true });
    await Deno.writeTextFile(filePath, content);
  }

  private populateTemplate(
    content: string,
    config: TemplateKey,
  ): string {
    let populatedContent = content;
    for (const [key, value] of Object.entries(config)) {
      const placeholder = `{{${key}}}`;
      let replacementValue: string;
      let isNonStringValue = false;

      if (Array.isArray(value)) {
        replacementValue = JSON.stringify(value);
        isNonStringValue = true;
      } else if (typeof value === "object" && value !== null) {
        replacementValue = JSON.stringify(value);
        isNonStringValue = true;
      } else if (typeof value === "number") {
        replacementValue = value.toString();
        isNonStringValue = true;
      } else {
        replacementValue = String(value);
      }

      if (isNonStringValue) {
        populatedContent = populatedContent.split(`"${placeholder}"`).join(
          replacementValue,
        );
      } else {
        populatedContent = populatedContent.split(placeholder).join(
          replacementValue,
        );
      }
    }

    return populatedContent;
  }
}

export { Template };
