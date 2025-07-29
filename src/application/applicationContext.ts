import { initDatabaseConnection } from '../common/persistence/database';
import { FileRepositoryFactory } from '../common/persistence/FileRepositoryFactory';
import type { FileSystemOperations } from '../common/server/FileSystemOperations';
import { type Environment } from './environment';
import { BookSearchClient } from './server/BookSearchClient';
import { DocumentAnalysisClient } from './server/DocumentAnalysisClient';

export async function initApplicationContext<DatabaseSchema extends Record<string, unknown>>(
  environment: Environment,
  databaseSchema: DatabaseSchema,
  fileSystem: FileSystemOperations,
) {
  const database = await initDatabaseConnection({
    ...environment.database,
    schema: databaseSchema,
  });

  const documentAnalysisClient = new DocumentAnalysisClient(
    environment.documentAnalysis.endpoint,
    environment.documentAnalysis.key,
  );

  const bookSearchClient = new BookSearchClient(environment.bookSearch.key);

  const fileRepositoryFactory = new FileRepositoryFactory(environment.fileUploadsPath, fileSystem);

  return {
    database,
    documentAnalysisClient,
    bookSearchClient,
    fileRepositoryFactory,
  } as const;
}

export type ApplicationContext<
  DatabaseSchema extends Record<string, unknown> = Record<string, unknown>,
> = Awaited<ReturnType<typeof initApplicationContext<DatabaseSchema>>>;
