import { createRequestContextStore } from '../../../common/server/requestContextStore';
import type { CookbookRepository } from './persistence/cookbookRepository';

type CookbooksContext = {
  cookbooksRepository: CookbookRepository;
};

export const cookbooksContext = createRequestContextStore<CookbooksContext>('CookbooksContext');
