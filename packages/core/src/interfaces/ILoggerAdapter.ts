export interface ILoggerAdapter {
  info(message: string): void;
  error(message: string): void;
  success(message: string): void;
  debug(message: string): void;
  process(message: string): void;
  msg(message: string, type: string, colorHex?: string): void;
}
