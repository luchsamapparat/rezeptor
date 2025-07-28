import { faker } from '@faker-js/faker';
import express from 'express';
import { join } from 'node:path';
import { afterEach as baseAfterEach, beforeEach as baseBeforeEach, test as baseTest } from 'vitest';
import { createServer } from '../bootstrap/server';

export const test = baseTest
  .extend<{ setup: TestApp }>({
    setup: async ({ }, use) => {
      const { app, database, cleanup } = await createTestApp();

      await use({ app, database });

      await cleanup();
    },
  })
  .extend<TestApp>({
    app: async ({ setup }, use) => use(setup.app),
    database: async ({ setup }, use) => use(setup.database),
  });

export const it = test;
export const beforeEach = baseBeforeEach<TestApp>;
export const afterEach = baseAfterEach<TestApp>;

async function createTestApp() {
  const app = express();

  const connectionString = `:memory:`;
  const migrationsPath = join(import.meta.dirname, '../../database');

  const { app: server, database } = await createServer({
    database: {
      connectionString,
      migrationsPath,
    },
    documentAnalysis: {
      endpoint: faker.internet.url(),
      key: faker.string.alphanumeric(),
    },
    bookSearch: {
      key: faker.string.alphanumeric(),
    },
  });

  app.use(server);

  return {
    app,
    database,
    async cleanup() { },
  };
}

export type TestApp = Omit<Awaited<ReturnType<typeof createTestApp>>, 'cleanup'>;