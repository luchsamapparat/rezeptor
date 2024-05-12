import { app } from '@azure/functions';
import { appContext } from '../../appContext';
import type { AuthenticatedRequestHandler } from '../../handler';
import { createAuthenticatedRequestHandler } from '../../handler';

const getRecipes: AuthenticatedRequestHandler = async ({ requestContext }) => {
  const recipeRepository = await requestContext.recipeRepository;

  const recipes = await recipeRepository.getAll();

  return {
    jsonBody: recipes
  };
};

app.http('getRecipes', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: createAuthenticatedRequestHandler(appContext, getRecipes)
});
