import { count, eq } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { Database } from './database';

export abstract class DatabaseRepository<TTable extends SQLiteTable & { id: SQLiteColumn }> {
  constructor(
    protected readonly database: Database<Record<string, unknown>>,
    protected readonly table: TTable,
  ) {}

  /**
   * Retrieve all records from the table
   */
  async getAll(): Promise<TTable['$inferSelect'][]> {
    return this.database.select().from(this.table);
  }

  /**
   * Insert a single record
   */
  async insert(entity: Omit<TTable['$inferInsert'], 'id'>): Promise<TTable['$inferSelect'][]> {
    return this.insertMany([entity]);
  }

  /**
   * Insert multiple records
   */
  async insertMany(entities: Array<Omit<TTable['$inferInsert'], 'id'>>): Promise<TTable['$inferSelect'][]> {
    // Generate a UUID for each entity and assign it to the id property
    const withIds = entities.map(entity => ({
      ...entity,
      id: crypto.randomUUID(),
    }) as TTable['$inferInsert']);
    return this.database.insert(this.table).values(withIds).returning();
  }

  /**
   * Find a record by its ID
   */
  async findById(id: string): Promise<TTable['$inferSelect'] | undefined> {
    const results = await this.database.select().from(this.table).where(eq(this.table.id, id)).limit(1);
    return results[0];
  }

  /**
   * Delete a record by its ID
   */
  async deleteById(id: string): Promise<TTable['$inferSelect'][]> {
    return this.database.delete(this.table).where(eq(this.table.id, id)).returning();
  }

  /**
   * Update a record by its ID
   */
  async update(id: string, updates: Partial<TTable['$inferInsert']>): Promise<TTable['$inferSelect'][]> {
    return this.database.update(this.table).set(updates).where(eq(this.table.id, id)).returning();
  }

  /**
   * Check if a record exists by its ID
   */
  async exists(id: string): Promise<boolean> {
    const result = await this.database.select({ id: this.table.id }).from(this.table).where(eq(this.table.id, id)).limit(1);
    return result.length > 0;
  }

  /**
   * Get the count of all records in the table
   */
  async count(): Promise<number> {
    const result = await this.database.select({ count: count() }).from(this.table);
    return result[0]?.count || 0;
  }
}
