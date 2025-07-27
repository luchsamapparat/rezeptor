import { posix, relative, resolve, sep } from 'node:path';

const srcPath = resolve(import.meta.dirname, '../../');

export const routeModulePath = (basePath: string) =>
  (routeModuleFilename = 'index.tsx') => `${relative(srcPath, basePath).split(sep).join(posix.sep)}/${routeModuleFilename}`;
