import type { FileSystemOperations } from '../common/server/FileSystemOperations';

/**
 * In-memory file system implementation for testing.
 * Stores files in memory without touching the actual file system.
 */
export class InMemoryFileSystem implements FileSystemOperations {
  private files = new Map<string, Buffer>();
  private directories = new Set<string>();

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    if (options?.recursive) {
      const parts = path.split(/[/\\]/);
      let currentPath = '';
      for (const part of parts) {
        if (part) {
          currentPath = currentPath ? this.join(currentPath, part) : part;
          this.directories.add(currentPath);
        }
      }
    }
    else {
      this.directories.add(path);
    }
  }

  async writeFile(path: string, data: Buffer | Uint8Array): Promise<void> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    this.files.set(path, buffer);
  }

  async readFile(path: string): Promise<Buffer> {
    const data = this.files.get(path);
    if (!data) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return data;
  }

  async unlink(path: string): Promise<void> {
    if (!this.files.has(path)) {
      throw new Error(`ENOENT: no such file or directory, unlink '${path}'`);
    }
    this.files.delete(path);
  }

  join(...paths: string[]): string {
    return paths.join('/').replace(/\/+/g, '/');
  }

  /**
   * Test utility: Clear all files and directories
   */
  clear(): void {
    this.files.clear();
    this.directories.clear();
  }

  /**
   * Test utility: Check if a file exists
   */
  hasFile(path: string): boolean {
    return this.files.has(path);
  }

  /**
   * Test utility: Get all stored files
   */
  getAllFiles(): Map<string, Buffer> {
    return new Map(this.files);
  }
}
