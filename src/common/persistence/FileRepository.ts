import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export class FileRepository {
  constructor(private directory: string) {}

  /**
   * Saves a file to the repository directory.
   * Creates the directory if it does not exist.
   */
  async save(file: Buffer | Uint8Array) {
    const filename = crypto.randomUUID();
    const filePath = join(this.directory, filename);
    await mkdir(this.directory, { recursive: true });
    await writeFile(filePath, file);
    return filename;
  }

  /**
   * Retrieves a file from the repository directory.
   */
  async get(filename: string) {
    const filePath = join(this.directory, filename);
    return await readFile(filePath);
  }

  /**
   * Removes a file from the repository directory.
   */
  async remove(filename: string) {
    const filePath = join(this.directory, filename);
    await unlink(filePath);
  }
}
