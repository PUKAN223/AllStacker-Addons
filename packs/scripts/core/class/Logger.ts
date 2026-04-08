/**
 * Singleton logger class for plugin system.
 * Provides consistent logging with prefix tags for different log levels.
 */
export class Logger {
  private static instance: Logger;

  private constructor() {}

  /**
   * Gets the singleton instance of the Logger.
   * @returns The Logger instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Logs a general message.
   * @param message - The message to log
   */
  public log(message: string): void {
    console.info(`[ LOG ] ${message}`);
  }

  /**
   * Logs an error message.
   * @param message - The error message to log
   */
  public error(message: string): void {
    console.error(`[ ERROR ] ${message}`);
  }

  /**
   * Logs a warning message.
   * @param message - The warning message to log
   */
  public warn(message: string): void {
    console.warn(`[ WARN ] ${message}`);
  }

  /**
   * Logs a debug message.
   * @param message - The debug message to log
   */
  public debug(message: string): void {
    console.info(`[ DEBUG ] ${message}`);
  }

  /**
   * Logs an info message.
   * @param message - The info message to log
   */
  public info(message: string): void {
    console.info(`[ INFO ] ${message}`);
  }
}
