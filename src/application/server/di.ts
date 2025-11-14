import { type Context, type Env } from 'hono';
import { Dependency, type Scope } from 'hono-simple-di';
import { isNull, memoize } from 'lodash-es';
import { type Database } from '../../common/persistence/database';
import { FileRepositoryFactory } from '../../common/persistence/FileRepositoryFactory';
import type { FileSystemOperations } from '../../common/server/FileSystemOperations';
import { NodeFileSystem } from '../../common/server/NodeFileSystem';
import { type Environment } from './environment';
import type { Logger } from './logging';

export const dependency = <E extends Env, T>(factory: (env: Environment, c: Context<E>) => T | Promise<T>, scope?: Scope) => new Dependency<T>(
  async (c) => {
    const env = await environment.resolve(c);

    if (isNull(env)) {
      throw new Error('No Environment provided.');
    }

    return factory(env, c);
  },
  { scope },
);

export const environment = new Dependency<Environment | null>(() => null);

export const logger = new Dependency<Logger>(() => {
  throw new Error('No Logger provided.');
});

export const createChildLogger = async <E extends Env>(
  context: Context<E>,
  parentLogger: Dependency<Logger>,
  bindings: Record<string, unknown>,
) => {
  const log = await parentLogger.resolve(context);
  return log.child(bindings);
};

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

export const fileRepositoryFactory = dependency(async (env, c) => {
  const log = await logger.resolve(c);
  return new FileRepositoryFactory(env.fileUploadsPath, await fileSystem.resolve(c), log);
}, 'request');

type DependencyType<T> = T extends Dependency<infer U> ? U : never;

export type ApplicationContext<DatabaseSchema extends Record<string, unknown>> = {
  environment: DependencyType<typeof environment>;
  logger: DependencyType<typeof logger>;
  fileSystem: DependencyType<typeof fileSystem>;
  database: Database<DatabaseSchema>;
  fileRepositoryFactory: DependencyType<typeof fileRepositoryFactory>;
};