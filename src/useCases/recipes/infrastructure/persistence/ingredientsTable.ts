import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { foreignKey, primaryKey } from '../../../../common/persistence/databaseSchema';
import { recipesTable } from './recipesTable';

export const ingredientsTable = sqliteTable('ingredients', {
  id: primaryKey(),
  recipeId: foreignKey(() => recipesTable.id, { onDelete: 'cascade' }).notNull(),
  quantity: text(),
  unit: text(),
  name: text().notNull(),
  notes: text(),
  sortOrder: integer().notNull().default(0),
});

export type IngredientEntity = typeof ingredientsTable.$inferSelect;
export type InsertIngredientEntity = Omit<typeof ingredientsTable.$inferInsert, 'id'>;
export type UpdateIngredientEntity = Partial<InsertIngredientEntity>;