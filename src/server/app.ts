import { createClient } from '@libsql/client';
import { createRequestHandler } from '@react-router/express';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import express from 'express';
import 'react-router';

import { DatabaseContext } from '~/database/context';
import * as schema from '~/database/schema';

declare module 'react-router' {
  interface AppLoadContext {
    VALUE_FROM_EXPRESS: string;
  }
}

export const app = express();

if (!process.env.DB_CONNECTION_STRING) throw new Error('DB_CONNECTION_STRING is required');

const client = createClient({ url: process.env.DB_CONNECTION_STRING! });
const db = drizzle(client, { schema });
void migrate(db, {
  migrationsFolder: 'database',
});

app.use((_, __, next) => DatabaseContext.run(db, next));

app.use(
  createRequestHandler({
    build: () => import('virtual:react-router/server-build'),
    getLoadContext() {
      return {
        VALUE_FROM_EXPRESS: 'Hello from Express',
      };
    },
  }),
);
