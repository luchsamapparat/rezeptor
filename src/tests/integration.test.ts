import { faker } from '@faker-js/faker';
import express from 'express';
import { join } from 'node:path';
import { afterEach as baseAfterEach, beforeEach as baseBeforeEach, test as baseTest } from 'vitest';
import { createServer } from '../bootstrap/server';
import { FileSystemMock } from './mocks/fileSystem.mock';

export const test = baseTest
  .extend<{ setup: TestApp }>({
    setup: async ({ }, use) => {
      const { app, database, fileSystemMock, cleanup } = await createTestApp();

      await use({ app, database, fileSystemMock });

      await cleanup();
    },
  })
  .extend<TestApp>({
    app: async ({ setup }, use) => use(setup.app),
    database: async ({ setup }, use) => use(setup.database),
    fileSystemMock: async ({ setup }, use) => use(setup.fileSystemMock),
  });

export const it = test;
export const beforeEach = baseBeforeEach<TestApp>;
export const afterEach = baseAfterEach<TestApp>;

async function createTestApp() {
  const app = express();

  const connectionString = `:memory:`;
  const migrationsPath = join(import.meta.dirname, '../../database');
  const fileSystemMock = new FileSystemMock();

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
    fileUploadsPath: '/data',
  }, fileSystemMock);

  app.use(server);

  return {
    app,
    database,
    fileSystemMock,
    async cleanup() {
      fileSystemMock.clear();
    },
  };
}

export type TestApp = Omit<Awaited<ReturnType<typeof createTestApp>>, 'cleanup'> & {
  fileSystemMock: FileSystemMock;
};