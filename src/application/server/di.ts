import { type Context, type Env } from 'hono';
import { Dependency } from 'hono-simple-di';
import { isNull, memoize } from 'lodash-es';
import { type Database } from '../../common/persistence/database';
import { FileRepositoryFactory } from '../../common/persistence/FileRepositoryFactory';
import type { FileSystemOperations } from '../../common/server/FileSystemOperations';
import { NodeFileSystem } from '../../common/server/NodeFileSystem';
import { type Environment } from './environment';
import { DocumentAnalysisClient } from './external/DocumentAnalysisClient';

export const dependency = <E extends Env, T>(factory: (env: Environment, c: Context<E>) => T | Promise<T>) => new Dependency<T>(
  async (c) => {
    const env = await environment.resolve(c);

    if (isNull(env)) {
      throw new Error('No Environment provided');
    }

    return factory(env, c);
  },
);

export const environment = new Dependency<Environment | null>(() => null);
export const fileSystem = new Dependency<FileSystemOperations>(() => new NodeFileSystem());

const optionalDatabase = memoize(<DatabaseSchema extends Record<string, unknown>>() => new Dependency<Database<DatabaseSchema> | null>(() => null));
export const database = memoize(<DatabaseSchema extends Record<string, unknown>>() => {
  const databaseDependency = optionalDatabase<DatabaseSchema>();
  const originalResolve = databaseDependency.resolve;
  const resolve = async (c: Context) => {
    const db = await originalResolve.bind(databaseDependency)(c);
    if (isNull(db)) {
      throw new Error('No Database provided');
    }
    return db;
  };
  databaseDependency.resolve = resolve.bind(databaseDependency);
  return databaseDependency as Dependency<Database<DatabaseSchema>>;
});

export const fileRepositoryFactory = dependency(async (env, c) => new FileRepositoryFactory(env.fileUploadsPath, await fileSystem.resolve(c)));
export const documentAnalysisClient = dependency(env => new DocumentAnalysisClient(env.documentAnalysis));

type DependencyType<T> = T extends Dependency<infer U> ? U : never;

export type ApplicationContext<DatabaseSchema extends Record<string, unknown>> = {
  environment: DependencyType<typeof environment>;
  fileSystem: DependencyType<typeof fileSystem>;
  database: Database<DatabaseSchema>;
  fileRepositoryFactory: DependencyType<typeof fileRepositoryFactory>;
  documentAnalysisClient: DependencyType<typeof documentAnalysisClient>;
};