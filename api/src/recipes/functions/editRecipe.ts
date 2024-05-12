import { app } from '@azure/functions';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { appContext } from '../../appContext';
import type { AuthenticatedRequestHandler } from '../../handler';
import { createAuthenticatedRequestHandler } from '../../handler';

const editRecipe: AuthenticatedRequestHandler = async ({ request, requestContext }) => {
  const recipeRepository = await requestContext.recipeRepository;

  const { id, title, pageNumber, cookbookId } = editRecipeRequestBodySchema.parse(await request.formData());

  await recipeRepository.update(id, {
    title,
    pageNumber,
    cookbookId
  });

  return {
    body: id
  };
};

app.http('editRecipe', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createAuthenticatedRequestHandler(appContext, editRecipe)
});

const editRecipeRequestBodySchema = zfd.formData({
  id: z.string().uuid(),
  title: zfd.text(),
  pageNumber: zfd.numeric().optional(),
  cookbookId: z.string().uuid(),
});
