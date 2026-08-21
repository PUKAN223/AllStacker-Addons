export interface IImageOptimizerAdapter {
  optimizePng(input: Uint8Array): Promise<Uint8Array>;
  optimizeJpg(input: Uint8Array): Promise<Uint8Array>;
}
