import { posix, relative, resolve, sep } from 'node:path';

const srcPath = resolve(import.meta.dirname, '../../');

export const getBasePath = (targetPath: string) => relative(srcPath, targetPath).split(sep).join(posix.sep);
