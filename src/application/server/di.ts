import { type Context, type Env } from 'hono';
import { Dependency, type Scope } from 'hono-simple-di';
import { isNull } from 'lodash-es';
import { createDatabaseClient, type DatabaseClient } from '../../common/persistence/database';
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

export const fileRepositoryFactory = dependency(async (env, c) => {
  const log = await logger.resolve(c);
  return new FileRepositoryFactory(env.fileUploadsPath, await fileSystem.resolve(c), log);
}, 'request');

export const database = dependency(async env => createDatabaseClient(env.database.connectionString));

type DependencyType<T> = T extends Dependency<infer U> ? U : never;

export type ApplicationContext = {
  environment: DependencyType<typeof environment>;
  logger: DependencyType<typeof logger>;
  fileSystem: DependencyType<typeof fileSystem>;
  database: DatabaseClient;
  fileRepositoryFactory: DependencyType<typeof fileRepositoryFactory>;
};