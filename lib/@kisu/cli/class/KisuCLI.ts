import chalk, { ChalkObj } from "jsr:@nothing628/chalk@1.0.1";
import { ConfigManagers, Logger, PackBuilder } from "@kisu/cli";

class KisuCLI {
    private args: string[];
    private logger: Logger = new Logger();

    constructor(args: string[] = Deno.args) {
        this.args = args;
        this.run();
    }

    private async run() {
        console.clear();
        const config = new ConfigManagers().getConfig();

        this.logger.info(`Loaded config pack: ${config.meta.name}@${config.meta.version.join(".")}`);

        const pb = new PackBuilder({
            name: config.meta.name,
            config: config,
        });

        if (this.isHelpCommand()) {
            this.logger.msg(
                "deno run --allow-read --allow-write --allow-env index.ts [--build] [--packs] [--clean]",
                "Usage",
                chalk.bgHex("#808080") as ChalkObj,
            );
            Deno.exit(0);
        } else {
            if (this.isCleanCommand()) pb.clean();
            if (this.isBuildCommand()) await pb.build();
            if (this.isPacksCommand()) pb.pack();

            if (!(this.isBuildCommand() || this.isPacksCommand() || this.isCleanCommand())) {
                await pb.build();
                pb.copyTo();
            }
        }
    }

    private isHelpCommand(): boolean {
        return this.args.includes("--help") || this.args.includes("-h");
    }

    private isBuildCommand(): boolean {
        return this.args.includes("--build");
    }

    private isPacksCommand(): boolean {
        return this.args.includes("--packs");
    }

    private isCleanCommand(): boolean {
        return this.args.includes("--clean");
    }
}
export default KisuCLI;
