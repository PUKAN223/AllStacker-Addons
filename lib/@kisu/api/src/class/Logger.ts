class Logger {
    private prefix: string;

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    public log(message: string): void {
        this.msg(message, "LOG");
    }

    public error(message: string): void {
        this.msg(message, "ERROR");
    }

    public warn(message: string): void {
        this.msg(message, "WARN");
    }

    public info(message: string): void {
        this.msg(message, "INFO");
    }

    public debug(message: string): void {
        this.msg(message, "DEBUG");
    }

    private msg(message: string, type: string) {
        console.warn(`[${this.prefix}][${type}] ${message}`);
    }
}

export { Logger };