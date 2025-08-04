import { faker } from '@faker-js/faker';
import { Hono } from 'hono';
import { join } from 'node:path';
import { afterEach as baseAfterEach, beforeEach as baseBeforeEach, test as baseTest } from 'vitest';
import { createApiServer } from '../bootstrap/apiServer';
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
  const app = new Hono();

  const connectionString = `:memory:`;
  const migrationsPath = join(import.meta.dirname, '../../database');
  const fileSystemMock = new FileSystemMock();

  const { app: api, database } = await createApiServer({
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

  app.route('/', api);

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