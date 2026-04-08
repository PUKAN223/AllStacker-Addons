import { ConfigManagers, Filters } from "@kisu/cli";
import { Manifest } from "./types/Manifest.ts";
import chalk from "jsr:@nothing628/chalk@1.0.1";

class ManifestBuilds extends Filters {
  private bpManifest = `${this.basePath}/BP/manifest.json`;
  private rpManifest = `${this.basePath}/RP/manifest.json`;
  private bpDirectory = `${this.basePath}/BP`;
  private rpDirectory = `${this.basePath}/RP`;
  private config = new ConfigManagers().getConfig();

  override async apply(): Promise<void> {
    await null;
    this.msg(`Looking for manifests...`);
    const BPManifest = this.readManifest(this.bpManifest);
    const RPManifest = this.readManifest(this.rpManifest);

    if (!BPManifest || !RPManifest) {
        this.msg(chalk.red(`No manifest.json found in BP or RP directories.`));
        return;
    } else {
        const BPUUIDs = this.uuidGen(this.config.meta.seed, 2);
        const RPUUIDs = this.uuidGen(this.config.meta.seed + 1000, 2);

        BPManifest.header.name = this.config.meta.name + `@${this.config.meta.version.join(".")} BP`;
        RPManifest.header.name = this.config.meta.name + `@${this.config.meta.version.join(".")} RP`;
        BPManifest.header.description = this.config.meta.description || BPManifest.header.description;
        RPManifest.header.description = this.config.meta.description || RPManifest.header.description;
        BPManifest.format_version = this.config.format_version;
        RPManifest.format_version = this.config.format_version;
        //UUID
        BPManifest.header.uuid = BPUUIDs[0];
        //Script Module
        BPManifest.modules.find((x) => x.language === "javascript")!.uuid = BPUUIDs[1];
        //UUID
        RPManifest.header.uuid = RPUUIDs[0];
        //Resource Module
        RPManifest.modules.find((x) => x.type === "resources")!.uuid = RPUUIDs[1];

        //Dependencies
        const bpDep = BPManifest.dependencies?.find((dep) => dep.uuid);
        if (bpDep) {
            bpDep.uuid = RPManifest.header.uuid;
        }
        const rpDep = RPManifest.dependencies?.find((dep) => dep.uuid);
        if (rpDep) {
            rpDep.uuid = BPManifest.header.uuid;
        }


        this.fileManagers.writeFile(
            this.bpManifest,
            JSON.stringify(BPManifest, null, 2),
        );
        this.fileManagers.writeFile(
            this.rpManifest,
            JSON.stringify(RPManifest, null, 2),
        );

        this.msg(`Updated manifest ${chalk.green("successfully")}.`);

        //Copy pack icons if exist
        this.fileManagers.removeFile(this.bpDirectory + "/pack_icon.png");
        this.fileManagers.removeFile(this.rpDirectory + "/pack_icon.png");
        
        this.fileManagers.copyFile(
            this.config.meta.icon,
            this.bpDirectory + "/pack_icon.png",
        );
        this.fileManagers.copyFile(
            this.config.meta.icon,
            this.rpDirectory + "/pack_icon.png",
        )
    }
  }

  private uuidGen(seed: number, count: number): string[] {
    const uuids: string[] = [];

    // simple deterministic seeded PRNG (mulberry32-like)
    const rnd = (function(a: number) {
        return function() {
            a |= 0;
            a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    })(seed);

    for (let i = 0; i < count; i++) {
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.floor(rnd() * 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        uuids.push(uuid);
    }
    return uuids;
  }

  public readManifest(path: string): Manifest | null {
    try {
      return JSON.parse(
        Deno.readTextFileSync(path),
      ) as Manifest;
    } catch {
      return null;
    }
  }
}

export { ManifestBuilds };
