import JSZip from "jszip";
import type { IArchiveAdapter } from  "@packages/core/src/interfaces/IArchiveAdapter.ts";

export class JSZipArchiveAdapter implements IArchiveAdapter {
  private zip: JSZip;

  constructor(existingZip?: JSZip) {
    this.zip = existingZip || new JSZip();
  }

  createNew(): IArchiveAdapter {
    return new JSZipArchiveAdapter();
  }

  createArchive(): void {
    this.zip = new JSZip();
  }

  addFolder(folderPath: string): void {
    this.zip.folder(folderPath);
  }

  addFile(filePath: string, data: string | Uint8Array): void {
    this.zip.file(filePath, data);
  }

  async generate(): Promise<Uint8Array> {
    return await this.zip.generateAsync({ type: "uint8array" });
  }

  getFolder(folderName: string): IArchiveAdapter | null {
    const subZip = this.zip.folder(folderName);
    if (subZip) {
      return new JSZipArchiveAdapter(subZip);
    }
    return null;
  }
}
