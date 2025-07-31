export class Logger {
    constructor() { }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    log(message) {
        console.info(`[ LOG ] ${message}`);
    }
    error(message) {
        console.info(`[ ERROR ] ${message}`);
    }
    warn(message) {
        console.info(`[ WARN ] ${message}`);
    }
    debug(message) {
        console.info(`[ DEBUG ] ${message}`);
    }
    info(message) {
        console.info(`[ INFO ] ${message}`);
    }
}
//# sourceMappingURL=Logger.js.map