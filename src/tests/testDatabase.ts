import { PGlite } from '@electric-sql/pglite';
import { isNull } from 'lodash-es';
import { exec } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { DatabaseClient } from '../common/persistence/database';
const execAsync = promisify(exec);

const migrationSqlPath = join(import.meta.dirname, '../../database/migration.sql');

/**
 * The Prisma CLI does not (yet) support initializing a PGLite database. Instead, we get Prisma to
 * dump a single migration file which can then be loaded by a PGLite instance to setup the
 * database.
 *
 * @see https://github.com/lucasthevenet/pglite-utils/issues/8#issuecomment-2147944548
 */
export async function generateMigrationSql() {
  const prismaSchemaPath = join(import.meta.dirname, '../../database/schema.prisma');
  await execAsync(
    `npx prisma migrate diff --from-empty --to-schema-datamodel ${prismaSchemaPath} --script > ${migrationSqlPath}`,
  );
}

export function getMigrationSql() {
  return readFileSync(migrationSqlPath, 'utf-8');
}

let database: PGlite | null = null;
let databaseClient: DatabaseClient | null = null;

export function setTestDatabase(db: PGlite, dbClient: DatabaseClient) {
  database = db;
  databaseClient = dbClient;
}

export function getTestDatabase() {
  if (isNull(database) || isNull(databaseClient)) {
    throw new Error('Test database has not been initialized. Make sure to call setTestDatabase() first.');
  }

  return {
    database,
    databaseClient,
  };
}
