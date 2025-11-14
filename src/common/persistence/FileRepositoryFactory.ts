import type { Logger } from '../../application/server/logging';
import type { FileSystemOperations } from '../server/FileSystemOperations';
import { FileRepository } from './FileRepository';

export class FileRepositoryFactory {
  constructor(
    private fileUploadsPath: string,
    private fileSystem: FileSystemOperations,
    private logger: Logger,
  ) { }

  createFileRepository(name: string) {
    const childLogger = this.logger.child({ component: 'FileRepository', repository: name });
    return new FileRepository(this.fileSystem.join(this.fileUploadsPath, name), this.fileSystem, childLogger);
  }
}