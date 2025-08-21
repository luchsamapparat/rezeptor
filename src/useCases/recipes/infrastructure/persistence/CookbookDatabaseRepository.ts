import type { Database } from '../../../../common/persistence/database';
import { DatabaseRepository } from '../../../../common/persistence/DatabaseRepository';
import type { CookbookRepository } from '../../cookbookManagement';
import { cookbooksTable } from './cookbooksTable';

export class CookbookDatabaseRepository extends DatabaseRepository<typeof cookbooksTable> implements CookbookRepository {
  constructor(
    database: Database<{ cookbooksTable: typeof cookbooksTable }>,
  ) {
    super(database, cookbooksTable);
  }
}
