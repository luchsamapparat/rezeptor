import { initDatabaseConnection } from '../common/persistence/database';
import { type Environment } from './environment';
import { BookSearchClient } from './server/BookSearchClient';
import { DocumentAnalysisClient } from './server/DocumentAnalysisClient';

export async function initApplicationContext<DatabaseSchema extends Record<string, unknown>>(environment: Environment, databaseSchema: DatabaseSchema) {
  const database = await initDatabaseConnection({
    ...environment.database,
    schema: databaseSchema,
  });

  const documentAnalysisClient = new DocumentAnalysisClient(
    environment.documentAnalysis.endpoint,
    environment.documentAnalysis.key,
  );

  const bookSearchClient = new BookSearchClient(environment.bookSearch.key);

  return {
    database,
    documentAnalysisClient,
    bookSearchClient,
  } as const;
}

export type ApplicationContext<
  DatabaseSchema extends Record<string, unknown> = Record<string, unknown>,
> = Awaited<ReturnType<typeof initApplicationContext<DatabaseSchema>>>;
