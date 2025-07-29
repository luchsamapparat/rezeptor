import { join } from 'node:path';
import type { FileSystemOperations } from './FileSystemOperations';

/**
 * Node.js file system implementation of FileSystemOperations.
 */
export class NodeFileSystem implements FileSystemOperations {
  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(path, options);
  }

  async writeFile(path: string, data: Buffer | Uint8Array): Promise<void> {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(path, data);
  }

  async readFile(path: string): Promise<Buffer> {
    const { readFile } = await import('node:fs/promises');
    return await readFile(path);
  }

  async unlink(path: string): Promise<void> {
    const { unlink } = await import('node:fs/promises');
    await unlink(path);
  }

  join(...paths: string[]): string {
    return join(...paths);
  }
}
