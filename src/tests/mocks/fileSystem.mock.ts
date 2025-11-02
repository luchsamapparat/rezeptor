import { InMemoryFileSystem } from '../InMemoryFileSystem';

/**
 * File system mock for testing that stores files in memory.
 * Provides additional testing utilities to inspect and manipulate the mock state.
 */
export class FileSystemMock extends InMemoryFileSystem {
  /**
   * Test utility: Get the content of a file as a string
   */
  async getFileAsString(path: string): Promise<string> {
    const stream = await this.readFile(path);
    return await new Response(stream).text();
  }

  /**
   * Test utility: Check if a file exists
   */
  fileExists(path: string): boolean {
    return this.hasFile(path);
  }

  /**
   * Test utility: Get the number of files stored
   */
  getFileCount(): number {
    return this.getAllFiles().size;
  }

  /**
   * Test utility: List all file paths
   */
  listFiles(): string[] {
    return Array.from(this.getAllFiles().keys());
  }
}
