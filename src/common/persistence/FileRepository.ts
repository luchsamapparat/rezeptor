import { ATTR_FILE_NAME, ATTR_FILE_PATH, ATTR_FILE_SIZE } from '@opentelemetry/semantic-conventions/incubating';
import type { Logger } from '../../application/server/logging';
import type { FileSystemOperations } from '../server/FileSystemOperations';

export class FileRepository {
  constructor(
    private directory: string,
    private fileSystem: FileSystemOperations,
    private log: Logger,
  ) { }

  /**
   * Saves a file to the repository directory.
   * Creates the directory if it does not exist.
   */
  async save(file: File): Promise<string> {
    const filename = crypto.randomUUID();
    await this.saveAs(filename, file);
    return filename;
  }

  /**
   * Saves a file using a caller-provided filename.
   * Intended for derived files whose name is tied to another stored file.
   */
  async saveAs(filename: string, file: File): Promise<void> {
    if (filename === '.' || filename === '..' || filename.includes('/') || filename.includes('\\')) {
      throw new Error('Filename must not contain path segments.');
    }

    const filePath = this.fileSystem.join(this.directory, filename);
    await this.fileSystem.mkdir(this.directory, { recursive: true });
    await this.fileSystem.writeFile(filePath, file.stream());
    this.log.info({
      [ATTR_FILE_NAME]: filename,
      [ATTR_FILE_SIZE]: file.size,
      [ATTR_FILE_PATH]: this.directory,
    }, 'File saved');
  }

  /**
   * Retrieves a file from the repository directory.
   */
  async get(filename: string): Promise<ReadableStream<Uint8Array>> {
    const filePath = this.fileSystem.join(this.directory, filename);
    return await this.fileSystem.readFile(filePath);
  }

  async exists(filename: string): Promise<boolean> {
    const filePath = this.fileSystem.join(this.directory, filename);
    return await this.fileSystem.exists(filePath);
  }

  /**
   * Removes a file from the repository directory.
   * Does not throw if the file does not exist.
   */
  async remove(filename: string) {
    const filePath = this.fileSystem.join(this.directory, filename);
    try {
      await this.fileSystem.unlink(filePath);
      this.log.info({
        [ATTR_FILE_NAME]: filename,
        [ATTR_FILE_PATH]: this.directory,
      }, 'File deleted');
    }
    catch (error) {
      // Only ignore "file not found" errors (ENOENT)
      // Re-throw any other errors (e.g., permission issues)
      if (error instanceof Error && error.message.includes('ENOENT')) {
        // File doesn't exist, which is fine - nothing to delete
        this.log.debug({
          [ATTR_FILE_NAME]: filename,
          [ATTR_FILE_PATH]: this.directory,
        }, 'File not found for deletion');
        return;
      }
      throw error;
    }
  }
}
