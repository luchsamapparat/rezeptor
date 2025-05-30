import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const guestBook = sqliteTable('guestBook', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text({ length: 255 }).notNull(),
  email: text({ length: 255 }).notNull().unique(),
});
