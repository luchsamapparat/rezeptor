import { Router } from 'express';

import { getApplicationContext } from '../../../application/server/applicationContextStore';
import { recipesContext } from './context';
import { RecipeRepository } from './persistence/recipeRepository';
import type { recipesTable } from './persistence/recipesTable';

export const recipesPath = '/recipes';

export const recipesApi = Router();

recipesApi.use(recipesContext.middleware(() => ({
  recipesRepository: new RecipeRepository(getApplicationContext<{ recipesTable: typeof recipesTable }>().database),
})));

recipesApi
  .route(recipesPath)
  .get(async (request, response) => {
    const { recipesRepository } = recipesContext.get();
    const allRecipes = await recipesRepository.getAll();
    response.json(allRecipes);
  });
