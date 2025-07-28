import type { BookSearchClient } from '../../../application/server/BookSearchClient';
import type { DocumentAnalysisClient } from '../../../application/server/DocumentAnalysisClient';
import { createRequestContextStore } from '../../../common/server/requestContextStore';
import type { CookbookRepository } from './persistence/cookbookRepository';

type CookbooksContext = {
  cookbooksRepository: CookbookRepository;
  documentAnalysisClient: DocumentAnalysisClient;
  bookSearchClient: BookSearchClient;
};

export const cookbooksContext = createRequestContextStore<CookbooksContext>('CookbooksContext');
