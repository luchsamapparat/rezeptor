import type { Database } from '../../../../common/persistence/database';
import { DatabaseRepository } from '../../../../common/persistence/DatabaseRepository';
import { cookbooksTable } from './cookbooksTable';

export class CookbookRepository extends DatabaseRepository<typeof cookbooksTable> {
  constructor(
    database: Database<{ cookbooksTable: typeof cookbooksTable }>,
  ) {
    super(database, cookbooksTable);
  }
}
