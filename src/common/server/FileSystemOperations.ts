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
   * Write data to a file using a web stream.
   */
  writeFile(path: string, data: ReadableStream<Uint8Array>): Promise<void>;

  /**
   * Read data from a file as a web stream.
   */
  readFile(path: string): Promise<ReadableStream<Uint8Array>>;

  /**
   * Delete a file.
   */
  unlink(path: string): Promise<void>;

  /**
   * Join path segments together.
   */
  join(...paths: string[]): string;
}
