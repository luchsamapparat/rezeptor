import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import type { AuthenticatedRequestHandler } from '../../handler';
import { createAuthenticatedRequestHandler } from '../../handler';

const getRecipe: AuthenticatedRequestHandler = async ({ request, requestEnv }) => {
  const recipeRepository = await requestEnv.get('recipeRepository');

  const id = getStringValue(request.query, 'id');

  const recipe = await recipeRepository.get(id);

  if (recipe === null) {
    return {
      status: 404
    };
  }

  return {
    jsonBody: recipe
  };
};

app.http('getRecipe', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: createAuthenticatedRequestHandler(appEnvironment, getRecipe)
});
