import { Router } from 'express';

import { getApplicationContext } from '../../../../application/server/applicationContextStore';
import { cookbooksContext } from '../cookbooksContext';
import { CookbookRepository } from '../persistence/cookbookRepository';
import type { cookbooksTable } from '../persistence/cookbooksTable';
import { addCookbook } from './addCookbook';
import { getCookbooks } from './getCookbooks';

export const cookbooksApi = Router();

cookbooksApi.use(cookbooksContext.middleware(() => ({
  cookbooksRepository: new CookbookRepository(getApplicationContext<{ cookbooksTable: typeof cookbooksTable }>().database),
})));

cookbooksApi
  .route('/cookbooks')
  .get(...getCookbooks)
  .post(...addCookbook);
