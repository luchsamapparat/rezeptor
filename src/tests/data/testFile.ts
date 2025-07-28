import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const loadTestFile = (filename: string) => readFile(resolve('examples', filename));
