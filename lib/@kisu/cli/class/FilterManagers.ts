import chalk from "jsr:@nothing628/chalk@1.0.1";
import { FileManagers, Logger } from "@kisu/cli";

class Filters {
    private name: string;
    public basePath: string = "./data/dist";
    public fileManagers;
    public log: string[];

    constructor(name: string, log: string[]) {
        this.name = name;
        this.fileManagers = new FileManagers();
        this.log = log;
    }

    public getName() {
        return this.name;
    }

    public msg(message: string) {
        this.log.push(chalk.grey(message));
    }

    async apply(): Promise<void> {

    }
}

class FilterManagers {
    private filters: (typeof Filters)[] = [];
    private logger: Logger;

    constructor() {
        this.logger = new Logger();
    }

    //any class that extends Filters can be registered
    public registerFilter(filter: typeof Filters) {
        this.filters.push(filter);
    }

    public getFilters() {
        return this.filters;
    }

    async applyFilters(): Promise<void> {
        this.logger.info("Applying filters...");
        for (const filter of this.filters) {
            const log = Array<string>();
            const filterInstance = new filter(filter.name, log);
            await filterInstance.apply();
            const logDisplay = log.map((x, i) => {
                return `\n${" ".repeat(10)} ${chalk.black(i+1)}. ${x}`;
            });
            if (log.length > 0) console.log(`${" ".repeat(8)}• ${chalk.blue(filterInstance.getName())}${logDisplay.join(",")}`);
            // this.logger.msg(`Applied filter: ${filterInstance.getName()}`, filterInstance.getName(), chalk.bgHex("#808080") as ChalkObj);
        }
    }
}

export { Filters, FilterManagers };