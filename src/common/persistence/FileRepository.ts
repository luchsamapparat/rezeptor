import type { FileSystemOperations } from '../server/FileSystemOperations';

export class FileRepository {
  constructor(
    private directory: string,
    private fileSystem: FileSystemOperations,
  ) {}

  /**
   * Saves a file to the repository directory.
   * Creates the directory if it does not exist.
   */
  async save(file: Buffer | Uint8Array) {
    const filename = crypto.randomUUID();
    const filePath = this.fileSystem.join(this.directory, filename);
    await this.fileSystem.mkdir(this.directory, { recursive: true });
    await this.fileSystem.writeFile(filePath, file);
    return filename;
  }

  /**
   * Retrieves a file from the repository directory.
   */
  async get(filename: string) {
    const filePath = this.fileSystem.join(this.directory, filename);
    return await this.fileSystem.readFile(filePath);
  }

  /**
   * Removes a file from the repository directory.
   * Does not throw if the file does not exist.
   */
  async remove(filename: string) {
    const filePath = this.fileSystem.join(this.directory, filename);
    try {
      await this.fileSystem.unlink(filePath);
    }
    catch (error) {
      // Only ignore "file not found" errors (ENOENT)
      // Re-throw any other errors (e.g., permission issues)
      if (error instanceof Error && error.message.includes('ENOENT')) {
        // File doesn't exist, which is fine - nothing to delete
        return;
      }
      throw error;
    }
  }
}
