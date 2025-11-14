import {
  ATTR_DB_COLLECTION_NAME,
  ATTR_DB_OPERATION_BATCH_SIZE,
  ATTR_DB_OPERATION_NAME,
  ATTR_DB_QUERY_PARAMETER,
  ATTR_DB_QUERY_TEXT,
} from '@opentelemetry/semantic-conventions/incubating';
import { count, eq, getTableName } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { Logger } from '../../application/server/logging';
import type { Database } from './database';
export abstract class DatabaseRepository<TTable extends SQLiteTable & { id: SQLiteColumn }> {
  constructor(
    protected readonly database: Database<Record<string, unknown>>,
    protected readonly table: TTable,
    protected readonly log: Logger,
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
  async insert(entity: Omit<TTable['$inferInsert'], 'id'>): Promise<TTable['$inferSelect']> {
    const results = await this.insertMany([entity]);
    return results[0];
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
    const query = this.database.insert(this.table).values(withIds).returning();
    const { sql, params } = query.toSQL();
    const results = await query;
    this.log.info(createLogContext({
      operation: 'INSERT',
      sql,
      params,
      table: this.table,
      batchSize: results.length,
    }), 'Batch records created');
    return results;
  }

  /**
   * Find a record by its ID
   */
  async findById(id: string): Promise<TTable['$inferSelect'] | null> {
    const results = await this.database.select().from(this.table).where(eq(this.table.id, id)).limit(1);
    return results[0] ?? null;
  }

  /**
   * Delete a record by its ID
   */
  async deleteById(id: string): Promise<TTable['$inferSelect'] | null> {
    const query = this.database.delete(this.table).where(eq(this.table.id, id)).returning();
    const { sql, params } = query.toSQL();
    const results = await query;

    if (results[0]) {
      this.log.info(createLogContext({
        operation: 'DELETE',
        sql,
        params,
        table: this.table,
      }), 'Record deleted');
    }
    return results[0] ?? null;
  }

  /**
   * Update a record by its ID
   */
  async update(id: string, updates: Partial<TTable['$inferInsert']>): Promise<TTable['$inferSelect'] | null> {
    const query = this.database.update(this.table).set(updates).where(eq(this.table.id, id)).returning();
    const { sql, params } = query.toSQL();
    const results = await query;

    if (results[0]) {
      this.log.info(createLogContext({
        operation: 'UPDATE',
        sql,
        params,
        table: this.table,
      }), 'Record updated');
    }
    return results[0] ?? null;
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

interface LogContextOptions {
  operation: string;
  sql: string;
  params: unknown[];
  table: SQLiteTable;
  batchSize?: number;
}

export function createLogContext({ operation, sql, params, table, batchSize }: LogContextOptions): Record<string, unknown> {
  const logContext: Record<string, unknown> = {
    [ATTR_DB_COLLECTION_NAME]: getTableName(table),
    [ATTR_DB_OPERATION_NAME]: operation,
    [ATTR_DB_QUERY_TEXT]: sql,
  };

  if (batchSize !== undefined && batchSize > 1) {
    logContext[ATTR_DB_OPERATION_BATCH_SIZE] = batchSize;
  }

  params.forEach((value, index) => {
    logContext[ATTR_DB_QUERY_PARAMETER(index.toString())] = value;
  });

  return logContext;
}