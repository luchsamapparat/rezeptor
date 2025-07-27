import { Router } from 'express';

import { getApplicationContext } from '../../../../application/server/applicationContextStore';
import { RecipeRepository } from '../persistence/recipeRepository';
import type { recipesTable } from '../persistence/recipesTable';
import { recipesContext } from '../recipesContext';
import { addRecipe } from './addRecipe';
import { editRecipe } from './editRecipe';
import { getRecipe } from './getRecipe';
import { getRecipes } from './getRecipes';
import { removeRecipe } from './removeRecipe';

export const recipesPath = '/recipes';

export const recipesApi = Router();

recipesApi.use(recipesContext.middleware(() => ({
  recipesRepository: new RecipeRepository(getApplicationContext<{ recipesTable: typeof recipesTable }>().database),
})));

recipesApi
  .route(recipesPath)
  .get(...getRecipes)
  .post(...addRecipe);

recipesApi
  .route(`${recipesPath}/:id`)
  .get(...getRecipe)
  .patch(...editRecipe)
  .delete(...removeRecipe);
