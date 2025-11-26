import { faker } from '@faker-js/faker';
import { Hono } from 'hono';
import { afterEach as baseAfterEach, beforeEach as baseBeforeEach, test as baseTest } from 'vitest';
import { createApiServer } from '../bootstrap/apiServer';
import type { DatabaseClient } from '../common/persistence/database';
import { FileSystemMock } from './mocks/fileSystem.mock';
import { loggerMock } from './mocks/logger.mock';
import { getTestDatabase } from './testDatabase';

export const test = baseTest
  .extend<{ setup: TestApp }>({
    setup: async ({}, use) => {
      const { env, app, database, fileSystemMock, cleanup } = await createTestApp(getTestDatabase().databaseClient);

      await use({ env, app, database, fileSystemMock });

      await cleanup();
    },
  })
  .extend<TestApp>({
    env: async ({ setup }, use) => use(setup.env),
    app: async ({ setup }, use) => use(setup.app),
    database: async ({ setup }, use) => use(setup.database),
    fileSystemMock: async ({ setup }, use) => use(setup.fileSystemMock),
  });

export const it = test;
export const beforeEach = baseBeforeEach<TestApp>;
export const afterEach = baseAfterEach<TestApp>;

async function createTestApp(database: DatabaseClient) {
  const app = new Hono();

  const env = {
    nodeEnv: 'test' as const,
    logging: {
      level: 'silent' as const,
    },
    openTelemetry: {
      serviceName: undefined,
      serviceVersion: undefined,
    },
    database: {
      connectionString: faker.string.alphanumeric(),
    },
    azureDocumentAnalysis: {
      endpoint: faker.internet.url(),
      key: faker.string.alphanumeric(),
    },
    googleBooks: {
      key: faker.string.alphanumeric(),
    },
    fileUploadsPath: '/data',
    azureOpenAI: {
      endpoint: faker.internet.url(),
      key: faker.string.alphanumeric(),
      model: 'gpt-5-nano',
      deployment: 'gpt-5-nano',
    },
    recipeExtraction: {
      systemPrompt: faker.lorem.words(),
      userPrompt: faker.lorem.words(),
    },
  };

  const fileSystem = new FileSystemMock();

  app.route('/', await createApiServer({
    env,
    rootLogger: loggerMock,
    fileSystem,
    database,
  }));

  return {
    env,
    app,
    database,
    fileSystemMock: fileSystem,
    async cleanup() {
      fileSystem.clear();
    },
  };
}

export type TestApp = Omit<Awaited<ReturnType<typeof createTestApp>>, 'cleanup'> & {
  fileSystemMock: FileSystemMock;
};
