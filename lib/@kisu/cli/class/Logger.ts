import chalk, { ChalkObj } from "jsr:@nothing628/chalk@1.0.1"

class Logger {
    private chalk = chalk;

    private prefix(type: string, color: ChalkObj) {
        return color(` ${type} `) + `:`;
    }

    public msg(message: string, type: string, color: ChalkObj) {
        const prefix = this.prefix(type.toUpperCase(), color);

        console.log(`${prefix} ${this.chalk.grey(message)}`);
    }

    public info(message: string) {
        const prefix = this.prefix("INFO", this.chalk.bgBlue);

        console.log(`${prefix} ${this.chalk.grey(message)}`);
    }

    public error(message: string) {
        const prefix = this.prefix("ERROR", this.chalk.bgRed);
        console.log(`${prefix} ${this.chalk.grey(message)}`);
    }

    public success(message: string) {
        const prefix = this.prefix("SUCCESS", this.chalk.bgGreen);

        console.log(`${prefix} ${this.chalk.grey(message)}`);
    }

    public debug(message: string) {
        const prefix = this.prefix("DEBUG", this.chalk.bgHex("#800080") as ChalkObj);
        console.log(`${prefix} ${this.chalk.grey(message)}`);
    }

    public process(message: string) {
        //Yellow
        const prefix = this.prefix("PROCESS", this.chalk.bgHex("#FFFF00") as ChalkObj);
        console.log(`${prefix} ${this.chalk.grey(message)}`)
    }
}

export { Logger };