import { app } from '@azure/functions';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { appContext } from '../../appContext';
import type { AuthenticatedRequestHandler } from '../../handler';
import { createAuthenticatedRequestHandler } from '../../handler';

const getRecipe: AuthenticatedRequestHandler = async ({ request, requestContext }) => {
  const recipeRepository = await requestContext.recipeRepository;

  const { id } = getRecipeQuerySchema.parse(request.query);

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
  handler: createAuthenticatedRequestHandler(appContext, getRecipe)
});

const getRecipeQuerySchema = zfd.formData({
  id: z.string().uuid(),
});
