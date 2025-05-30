import { AsyncLocalStorage } from 'node:async_hooks';

import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';

export const DatabaseContext = new AsyncLocalStorage<
  LibSQLDatabase<typeof schema>
>();

export function database() {
  const db = DatabaseContext.getStore();
  if (!db) {
    throw new Error('DatabaseContext not set');
  }
  return db;
}
