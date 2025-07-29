import { Router } from 'express';

import { getApplicationContext } from '../../../../application/server/applicationContextStore';
import { RecipeRepository } from '../persistence/recipeRepository';
import type { recipesTable } from '../persistence/recipesTable';
import { recipesContext } from '../recipesContext';
import { addRecipe } from './addRecipe';
import { addRecipePhoto } from './addRecipePhoto';
import { editRecipe } from './editRecipe';
import { getRecipe } from './getRecipe';
import { getRecipes } from './getRecipes';
import { recipeIdentifierName, recipesPath } from './recipeApiModel';
import { removeRecipe } from './removeRecipe';

export const recipesApi = Router();

recipesApi.use(recipesContext.middleware(() => {
  const { database, fileRepositoryFactory, documentAnalysisClient } = getApplicationContext<{ recipesTable: typeof recipesTable }>();
  return {
    recipesRepository: new RecipeRepository(database),
    recipeFileRepository: fileRepositoryFactory.createFileRepository('recipes'),
    recipePhotoFileRepository: fileRepositoryFactory.createFileRepository('recipePhotos'),
    documentAnalysisClient,
  };
}));

recipesApi
  .route(recipesPath)
  .get(...getRecipes)
  .post(...addRecipe);

recipesApi
  .route(`${recipesPath}/:${recipeIdentifierName}`)
  .get(...getRecipe)
  .patch(...editRecipe)
  .delete(...removeRecipe);

recipesApi
  .route(`${recipesPath}/:${recipeIdentifierName}/photo`)
  .put(...addRecipePhoto);
