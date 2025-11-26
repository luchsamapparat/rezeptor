import { PGlite } from '@electric-sql/pglite';
import { PrismaClient } from '@prisma/client';
import { PrismaPGlite } from 'pglite-prisma-adapter';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { getMigrationSql, getTestDatabase, setTestDatabase } from './testDatabase';

beforeAll(async () => {
  const database = new PGlite({
    dataDir: 'memory://',
  });

  await database.exec(getMigrationSql());

  const databaseClient = new PrismaClient({
    adapter: new PrismaPGlite(database),
  });

  setTestDatabase(database, databaseClient);
});

afterAll(async () => {
  const { database, databaseClient } = getTestDatabase();

  try {
    await databaseClient.$disconnect();
    await database.close();
  }
  catch (error) {
    console.warn('Cleanup warning:', error);
  }
});

beforeEach(async () => {
  const { database } = getTestDatabase();

  const result = await database.query<{ tablename: string }>(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE '_prisma%'
      ORDER BY tablename;
    `);

  const tableNames = result.rows.map(row => row.tablename);

  if (tableNames.length > 0) {
    await database.exec(`
      SET session_replication_role = replica;
      TRUNCATE TABLE ${tableNames.map(name => `"${name}"`).join(', ')} RESTART IDENTITY CASCADE;
      SET session_replication_role = DEFAULT;
    `);
  }
});