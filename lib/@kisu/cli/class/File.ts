import { FileOptions } from "../types/FileOptions.ts";
import { FileManagers } from "./FileManagers.ts";

class File {
  private name: string;
  private path: string;
  private content: string | Uint8Array;
  private extension: string | null = null;
  private fileManagers: FileManagers;

  constructor(options: FileOptions) {
    this.name = options.name;
    this.path = options.path;
    this.content = options.content || "";
    this.fileManagers = new FileManagers();

    this.extension = this.path.split(".").pop()?.toLowerCase() || null;
  }

  public getName() {
    return this.name;
  }

  public getPath() {
    return this.path;
  }

  public getContent() {
    return this.content;
  }

  public getExtension() {
    return this.extension;
  }

  public remove() {
    this.fileManagers.removeFile(this.path);
  }

  public setExtension(extension: string | null, save: boolean = true) {
    if (save) {
      this.save({ path: this.path, name: this.name, content: this.content });
    }
    this.extension = extension;
  }

  public setContent(content: string | Uint8Array, save: boolean = true) {
    if (save) this.save({ path: this.path, name: this.name, content: content });
    this.content = content;
  }

  public setPath(path: string, del: boolean = false, save: boolean = true) {
    if (save) this.save({ path: path, name: this.name, content: this.content });
    if (del) {
        this.fileManagers.removeFile(this.path);
    }
    this.path = path;
  }

  public setName(name: string, save: boolean = true) {
    if (save) this.save({ path: this.path, name: name, content: this.content });
    this.name = name;
  }

  public save(options: FileOptions) {
    //replace file name and extension in path
    const pathParts = this.path.split("/");
    pathParts[pathParts.length - 1] = options.name + (this.extension ? `.${this.extension}` : "");
    const newPath = pathParts.join("/");
    this.fileManagers.writeFile(newPath, options.content || "");
    // this.fileManagers.removeFile(this.path);
  }
}

export { File };
