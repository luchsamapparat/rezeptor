import { createUseCaseContext } from '~/application/server/useCaseContext';
import type { cookbooksSchema } from './persistence';

export const cookbooksContext = createUseCaseContext<typeof cookbooksSchema>('CookbooksContext');
