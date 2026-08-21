export interface IArchiveAdapter {
  createNew(): IArchiveAdapter;
  createArchive(): void;
  addFolder(folderPath: string): void;
  addFile(filePath: string, data: string | Uint8Array): void;
  generate(): Promise<Uint8Array>;
  getFolder(folderName: string): IArchiveAdapter | null;
}
