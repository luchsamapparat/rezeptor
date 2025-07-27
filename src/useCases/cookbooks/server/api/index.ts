import { Router } from 'express';

import { getApplicationContext } from '../../../../application/server/applicationContextStore';
import { cookbooksContext } from '../cookbooksContext';
import { CookbookRepository } from '../persistence/cookbookRepository';
import type { cookbooksTable } from '../persistence/cookbooksTable';

import { addCookbook } from './addCookbook';
import { editCookbook } from './editCookbook';
import { getCookbooks } from './getCookbooks';
import { removeCookbook } from './removeCookbook';

export const cookbooksPath = '/cookbooks';

export const cookbooksApi = Router();

cookbooksApi.use(cookbooksContext.middleware(() => ({
  cookbooksRepository: new CookbookRepository(getApplicationContext<{ cookbooksTable: typeof cookbooksTable }>().database),
})));

cookbooksApi
  .route(cookbooksPath)
  .get(...getCookbooks)
  .post(...addCookbook);

cookbooksApi
  .route(`${cookbooksPath}/:id`)
  .patch(...editCookbook)
  .delete(...removeCookbook);
