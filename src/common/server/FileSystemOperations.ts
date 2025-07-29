/**
 * Abstraction over file system operations to enable mocking in tests
 * and future replacement with cloud storage solutions like S3.
 */
export interface FileSystemOperations {
  /**
   * Create a directory and any necessary parent directories.
   */
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;

  /**
   * Write data to a file.
   */
  writeFile(path: string, data: Buffer | Uint8Array): Promise<void>;

  /**
   * Read data from a file.
   */
  readFile(path: string): Promise<Buffer>;

  /**
   * Delete a file.
   */
  unlink(path: string): Promise<void>;

  /**
   * Join path segments together.
   */
  join(...paths: string[]): string;
}
