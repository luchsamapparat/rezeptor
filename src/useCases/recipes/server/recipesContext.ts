import { createRequestContextStore } from '../../../common/server/requestContextStore';
import type { RecipeRepository } from './persistence/recipeRepository';

type RecipesContext = {
  recipesRepository: RecipeRepository;
};

export const recipesContext = createRequestContextStore<RecipesContext>('RecipesContext');
