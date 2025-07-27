import type { Database } from '../../../../common/persistence/database';
import { Repository } from '../../../../common/persistence/repository';
import { cookbooksTable } from './cookbooksTable';

export class CookbookRepository extends Repository<typeof cookbooksTable> {
  constructor(
    database: Database<{ cookbooksTable: typeof cookbooksTable }>,
  ) {
    super(database, cookbooksTable);
  }
}
