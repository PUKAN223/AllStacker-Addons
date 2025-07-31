export class Logger {
    private static instance: Logger;

    private constructor() { }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public log(message: string): void {
        console.info(`[ LOG ] ${message}`);
    }

    public error(message: string): void {
        console.info(`[ ERROR ] ${message}`);
    }

    public warn(message: string): void {
        console.info(`[ WARN ] ${message}`);
    }

    public debug(message: string): void {
        console.info(`[ DEBUG ] ${message}`);
    }

    public info(message: string): void {
        console.info(`[ INFO ] ${message}`);
    }
}