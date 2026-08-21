import sharp from "sharp";
import type { IImageOptimizerAdapter } from  "@packages/core/src/interfaces/IImageOptimizerAdapter.ts";

// Disable sharp's internal libvips file cache
sharp.cache(false);

export class SharpOptimizerAdapter implements IImageOptimizerAdapter {
  async optimizePng(input: Uint8Array): Promise<Uint8Array> {
    const [paletteResult, trueResult] = await Promise.all([
      sharp(input)
        .png({
          palette: true,
          colours: 256,
          quality: 100,
          effort: 10,
          compressionLevel: 9,
          adaptiveFiltering: true,
        })
        .toBuffer()
        .then((b) => new Uint8Array(b)),
      sharp(input)
        .png({
          palette: false,
          compressionLevel: 9,
          effort: 10,
          adaptiveFiltering: true,
        })
        .toBuffer()
        .then((b) => new Uint8Array(b)),
    ]);

    return paletteResult.length <= trueResult.length ? paletteResult : trueResult;
  }

  async optimizeJpg(input: Uint8Array): Promise<Uint8Array> {
    const compressed = await sharp(input)
      .jpeg({
        quality: 82,
        mozjpeg: true,
        progressive: true,
        optimiseCoding: true,
        trellisQuantisation: true,
        overshootDeringing: true,
        optimiseScans: true,
      })
      .toBuffer()
      .then((b) => new Uint8Array(b));
    return compressed;
  }
}
