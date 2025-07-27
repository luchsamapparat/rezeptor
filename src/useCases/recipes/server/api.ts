import { Router } from 'express';

export const recipesPath = '/recipes';

export const recipesApi = Router();

recipesApi
  .route(recipesPath)
  .get((request, response) => {
    response.json([]);
  });
