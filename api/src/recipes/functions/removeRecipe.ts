import { app } from '@azure/functions';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { appContext } from '../../appContext';
import type { AuthenticatedRequestHandler } from '../../handler';
import { createAuthenticatedRequestHandler } from '../../handler';

const removeRecipe: AuthenticatedRequestHandler = async ({ request, requestContext }) => {
  const recipeRepository = await requestContext.recipeRepository;

  const formData = await request.formData();

  const { id } = getRemoveRecipeQuerySchema.parse(formData);

  const recipe = await recipeRepository.get(id);

  if (recipe !== null) {
    await recipeRepository.delete(id);

    if (recipe.photoFileId !== null) {
      await recipeRepository.deletePhotoFile(recipe.photoFileId);
    }

    if (recipe.recipeFileId !== null) {
      await recipeRepository.deleteRecipeFile(recipe.recipeFileId);
    }
  }


  return {
    body: null
  };
};

app.http('removeRecipe', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createAuthenticatedRequestHandler(appContext, removeRecipe)
});

const getRemoveRecipeQuerySchema = zfd.formData({
  id: z.string().uuid(),
});
