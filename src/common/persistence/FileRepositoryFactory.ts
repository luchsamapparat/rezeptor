import type { FileSystemOperations } from '../server/FileSystemOperations';
import { FileRepository } from './FileRepository';

export class FileRepositoryFactory {
  constructor(
    private fileUploadsPath: string,
    private fileSystem: FileSystemOperations,
  ) { }

  createFileRepository(name: string) {
    return new FileRepository(this.fileSystem.join(this.fileUploadsPath, name), this.fileSystem);
  }
}