import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import type { FileSystemOperations } from './FileSystemOperations';

/**
 * Node.js file system implementation of FileSystemOperations.
 */
export class NodeFileSystem implements FileSystemOperations {
  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(path, options);
  }

  async writeFile(path: string, data: ReadableStream<Uint8Array>): Promise<void> {
    const { createWriteStream } = await import('node:fs');
    const writable = createWriteStream(path);
    const nodeReadable = Readable.fromWeb(data as WebReadableStream<Uint8Array>);
    await pipeline(nodeReadable, writable);
  }

  async readFile(path: string): Promise<ReadableStream<Uint8Array>> {
    const { createReadStream } = await import('node:fs');
    return Readable.toWeb(createReadStream(path)) as unknown as ReadableStream<Uint8Array>;
  }

  async unlink(path: string): Promise<void> {
    const { unlink } = await import('node:fs/promises');
    await unlink(path);
  }

  join(...paths: string[]): string {
    return join(...paths);
  }
}
