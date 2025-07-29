import { Router } from 'express';

import { getApplicationContext } from '../../../../application/server/applicationContextStore';
import { cookbooksContext } from '../cookbooksContext';
import { CookbookRepository } from '../persistence/cookbookRepository';
import type { cookbooksTable } from '../persistence/cookbooksTable';

import { addCookbook } from './addCookbook';
import { cookbookIdentifierName, cookbooksPath } from './cookbookApiModel';
import { editCookbook } from './editCookbook';
import { getCookbooks } from './getCookbooks';
import { identifyCookbook } from './identifyCookbook';
import { removeCookbook } from './removeCookbook';

export const cookbooksApi = Router();

cookbooksApi.use(cookbooksContext.middleware(() => {
  const { database, documentAnalysisClient, bookSearchClient } = getApplicationContext<{ cookbooksTable: typeof cookbooksTable }>();
  return {
    cookbooksRepository: new CookbookRepository(database),
    documentAnalysisClient,
    bookSearchClient,
  };
}));

cookbooksApi
  .route(cookbooksPath)
  .get(...getCookbooks)
  .post(...addCookbook);

cookbooksApi
  .route(`${cookbooksPath}/identification`)
  .post(...identifyCookbook);

cookbooksApi
  .route(`${cookbooksPath}/:${cookbookIdentifierName}`)
  .patch(...editCookbook)
  .delete(...removeCookbook);
