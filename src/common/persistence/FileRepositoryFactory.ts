import { join } from 'node:path';
import { FileRepository } from './FileRepository';

export class FileRepositoryFactory {
  constructor(private fileUploadsPath: string) { }

  createFileRepository(name: string) {
    return new FileRepository(join(this.fileUploadsPath, name));
  }
}