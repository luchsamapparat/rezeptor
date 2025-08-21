import mime from 'mime';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Loads a file from the examples folder and returns a Web File instance
 * suitable for appending to FormData in Node/Vitest.
 */
export const loadTestFile = async (filename: string): Promise<File> => {
  const filePath = resolve('examples', filename);
  const data = await readFile(filePath);

  const type = mime.getType(filename) ?? 'application/octet-stream';
  // Convert Buffer to Uint8Array to satisfy BlobPart typing in DOM libs
  const part = new Uint8Array(data);
  return new File([part], filename, { type });
};
