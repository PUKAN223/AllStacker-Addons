import { File } from "@kisu/cli";

class FileManagers {
  constructor() {
  }

  //Directory Methods
  async copyDirectory(source: string, destination: string) {
    try {
      await Deno.stat(source);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return;
      }
      throw error;
    }
    await Deno.mkdir(destination, { recursive: true });
    for await (const entry of Deno.readDir(source)) {
      const srcPath = `${source}/${entry.name}`;
      const destPath = `${destination}/${entry.name}`;
      if (entry.isDirectory) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await Deno.copyFile(srcPath, destPath);
      }
    }
  }

  public readDirectory(path: string) {
    return Deno.readDirSync(path);
  }

  public removeDirectory(path: string) {
    try {
      Deno.statSync(path);
      Deno.removeSync(path, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
      // Silently ignore if directory doesn't exist
    }
  }

  public eachFileInDirectory(path: string, callback: (file: File) => void) {
    const dir = Deno.readDirSync(path);
    for (const file of dir) {
      if (!file.isFile) {
        this.eachFileInDirectory(`${path}/${file.name}`, callback);
        continue;
      }
      // console.log(path)
      const fileInfo: File = new File({
        name: file.name.split(".")[0],
        path: `${path}/${file.name}`,
        content: this.readFile(`${path}/${file.name}`),
      });
      callback(fileInfo);
    }
  }

  public createDirectory(path: string) {
    Deno.mkdirSync(path, { recursive: true });
  }

  public renameDirectory(oldPath: string, newPath: string) {
    Deno.renameSync(oldPath, newPath);
  }

  //File Methods
  public readFile(path: string) {
    const extension = path.split(".").pop()?.toLowerCase();
    if (extension && ["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(extension)) {
      return Deno.readFileSync(path);
    }
    return Deno.readTextFileSync(path);
  }

  public writeFile(path: string, content: string | Uint8Array) {
    //create directory if not exists
    this.createDirectory(path.split("/").slice(0, -1).join("/"));
    const extension = path.split(".").pop()?.toLowerCase();
    if (extension && ["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(extension)) {
      if (content instanceof Uint8Array) {
        Deno.writeFileSync(path, content);
      } else {
        throw new Error("Binary file content must be provided as Uint8Array");
      }
    } else {
      if (typeof content === "string") {
        Deno.writeTextFileSync(path, content);
      } else {
        throw new Error("Text file content must be provided as string");
      }
    }
  }

  public removeFile(path: string) {
    try {
      // Check if file exists before attempting to remove
      Deno.statSync(path);
      Deno.removeSync(path);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
      // Silently ignore if file doesn't exist
    }
  }

  public copyFile(source: string, destination: string) {
    try {
      Deno.statSync(source);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return;
      }
      throw error;
    }
    Deno.copyFileSync(source, destination);
  }

  public createFile(path: string) {
    Deno.writeTextFileSync(path, "");
  }

  public renameFile(oldPath: string, newPath: string) {
    Deno.renameSync(oldPath, newPath);
  }
}

export { FileManagers };
