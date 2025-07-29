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

recipesApi.use(recipesContext.middleware(() => {
  const { database, fileRepositoryFactory, documentAnalysisClient } = getApplicationContext<{ recipesTable: typeof recipesTable }>();
  return {
    recipesRepository: new RecipeRepository(database),
    recipeFileRepository: fileRepositoryFactory.createFileRepository('recipes'),
    documentAnalysisClient,
  };
}));

recipesApi
  .route(recipesPath)
  .get(...getRecipes)
  .post(...addRecipe);

recipesApi
  .route(`${recipesPath}/:id`)
  .get(...getRecipe)
  .patch(...editRecipe)
  .delete(...removeRecipe);
