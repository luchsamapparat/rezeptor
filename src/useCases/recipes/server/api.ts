import { Router } from 'express';
import { recipesContext } from './context';

export const recipesPath = '/recipes';

export const recipesApi = Router();

recipesApi.use(recipesContext.middleware);

recipesApi
  .route(recipesPath)
  .get(async (request, response) => {
    const { database } = recipesContext.get();
    const allRecipes = await database.query.recipes.findMany();
    response.json(allRecipes);
  });
