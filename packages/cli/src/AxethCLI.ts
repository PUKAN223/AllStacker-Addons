import * as prompts from "@clack/prompts";
import denoJson from "../deno.json" with { type: "json" };
import * as string from "@utils/string";
import "colors";
import { Template } from "@axeth/template";
import path from "node:path";
import process from "node:process";
import { exec } from "node:child_process";

type VersionFetchOptions = {
  type: "npm" | "jsr";
  latest?: boolean;
};

class AxethCLI {
  private readonly axethAPI = `@axeth/api`;
  private readonly axethCore = `@axeth/core`;

  private templateGenerators: Template;

  constructor() {
    console.clear();
    this.templateGenerators = new Template();
    this.init();
  }

  get intro(): string {
    return [
      "\n    _            _   \n   /_\\  __ _____| |_ \n  / _ \\ \\ \\ / -_)  _|\n /_/ \\_\\/\\_\\_\\___|\\__|\n                     "
        .cyan,
      " ".repeat(3) + "Axeth CLI " + ("v" + this.version()).green,
    ].join("\n");
  }

  private version() {
    return denoJson.version;
  }

  private async init() {
    prompts.intro(this.intro);
    const addonInfo = await this.addonInfo();
    const projectConfig = await this.projectConfig();
    const spinner = prompts.spinner({ indicator: "dots" });

    spinner.start("Checking config...");
    const structuredData = await this.restructureData<
      typeof addonInfo,
      typeof projectConfig
    >(addonInfo, projectConfig);
    spinner.stop("Config checked.");

    await this.templateGenerators.generateTemplate(
      structuredData,
      spinner,
    );

    const isOpenOnVSCode = await prompts.confirm({
      message: "Open the project in VSCode?",
      initialValue: false,
    });
    if (isOpenOnVSCode) {
      const projectDir = path.join(
        process.cwd(),
        structuredData.project_name,
      );
      spinner.start("Opening project in VSCode...");
      await this.runCommand("code .", projectDir);
      spinner.stop("Project opened in VSCode.");
    }
    prompts.note(
      "You can build using the following command:\n  > deno run dev",
      "Next Steps",
    );
    prompts.outro(
      `\n  Successfully created add-on: ${structuredData.pack_name}\n`.green,
    );
    process.exit(0);
  }

  private onCancel() {
    prompts.outro("Operation cancelled.".red);
    process.exit(0);
  }

  private async runCommand(command: string, cwd?: string) {
    return (await new Promise<void>((resolve, reject) => {
      exec(command, { cwd: cwd || Deno.cwd() }, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    }));
  }

  private async restructureData<T, K>(addonInfo: T, projectConfig: K) {
    const minecraftServerUIVersion = await this.fetchModuleVersion(
      "@minecraft/server-ui",
      { type: "npm", latest: true },
    );
    const minecraftServerVersion = await this.fetchModuleVersion(
      "@minecraft/server",
      { type: "npm", latest: true },
    );

    return {
      project_name: string.toCamelCase(
        addonInfo["addonName" as keyof T] as string,
      ),
      pack_name: addonInfo["addonName" as keyof T] as string,
      pack_description: addonInfo["description" as keyof T] as string,
      authors: (addonInfo["authors" as keyof T] as string).split(",").map((x) =>
        x.trim()
      ),
      version: (addonInfo["version" as keyof T] as string).split(".").map((x) =>
        parseInt(x, 10)
      ),
      seed: Math.floor(Math.random() * 1000000),

      axethApiVersion: projectConfig["axethApiVersion" as keyof K],
      axethCoreVersion: projectConfig["axethCoreVersion" as keyof K],
      axethApiName: this.axethAPI,
      axethCoreName: this.axethCore,

      minecraftServerUIVersion: minecraftServerUIVersion[0],
      minecraftServerVersion: minecraftServerVersion[0],
    };
  }

  private async addonInfo() {
    const defaultValues = {
      addonName: "Axeth-Addon",
      description: "This addon create for Minecraft Bedrock (Axeth)",
      version: "1.0.0",
      authors: "YourName,Axeth",
    };

    const addonName = await prompts.text({
      message: "Add-on Name",
      placeholder: defaultValues.addonName,
    });

    if (prompts.isCancel(addonName)) this.onCancel();

    const description = await prompts.text({
      message: "Add-on Description",
      placeholder: defaultValues.description,
    });

    if (prompts.isCancel(description)) this.onCancel();

    const version = await prompts.text({
      message: "Version",
      placeholder: defaultValues.version,
    });

    if (prompts.isCancel(version)) this.onCancel();

    const authors = await prompts.text({
      message: "Authors",
      placeholder: defaultValues.authors,
    });

    if (prompts.isCancel(authors)) this.onCancel();

    return {
      addonName: (addonName || defaultValues.addonName).toString(),
      description: (description || defaultValues.description).toString(),
      version: (version || defaultValues.version).toString(),
      authors: (authors || defaultValues.authors).toString(),
    } as const;
  }

  private async projectConfig() {
    const spinner = prompts.spinner({ indicator: "dots" });
    spinner.start("Fetching latest Axeth API version...");
    const versions = await this.fetchModuleVersion(this.axethAPI);
    spinner.stop(`Fetched @axeth/api ${versions.length} versions.`);

    const selectedVersion = await prompts.select({
      message: "Select Axeth API version",
      options: versions.map((x, i) => ({
        label: x,
        x,
        value: x,
        hint: i === 0 ? "Latest" : undefined,
      })),
    });

    if (prompts.isCancel(selectedVersion)) this.onCancel();
    const axethCoreVersion = (await this.fetchModuleVersion(this.axethCore, {
      type: "jsr",
      latest: true,
    }))[0];
    return {
      axethApiVersion: (selectedVersion || versions[0]).toString(),
      axethCoreVersion: axethCoreVersion,
    } as const;
  }

  private async fetchModuleVersion(
    module: string,
    options: VersionFetchOptions = { type: "jsr" },
  ): Promise<string[]> {
    let moduleData = null;
    try {
      if (options.type === "npm") {
        moduleData = await fetch(`https://registry.npmjs.org/${module}`).then(
          (res) => res.json(),
        );
        if (!moduleData?.versions) return [];
        if (options.latest) {
          return moduleData["dist-tags"]?.latest
            ? [moduleData["dist-tags"].latest]
            : [];
        }
        return Object.keys(moduleData.versions).reverse();
      } else {
        moduleData = await fetch(`https://jsr.io/${module}/meta.json`).then(
          (res) => res.json(),
        );
        if (!moduleData?.versions || !moduleData) return [];
        if (options.latest) {
          return moduleData.latest ? [moduleData.latest] : [];
        }
        return Object.keys(moduleData.versions).sort((a, b) => {
          const dateA = new Date(moduleData!.versions[a].createdAt);
          const dateB = new Date(moduleData!.versions[b].createdAt);
          return dateB.getTime() - dateA.getTime();
        });
      }
    } catch {
      return [];
    }
  }
}

export { AxethCLI };
