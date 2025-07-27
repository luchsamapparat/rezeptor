import { createUseCaseContext } from '../../../application/server/useCaseContext';
import type { recipesSchema } from './persistence';

export const recipesContext = createUseCaseContext<typeof recipesSchema>('RecipesContext');
