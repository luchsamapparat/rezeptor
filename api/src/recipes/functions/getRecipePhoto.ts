import { app } from '@azure/functions';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { appContext } from '../../appContext';
import type { AuthenticatedRequestHandler } from '../../handler';
import { createAuthenticatedRequestHandler } from '../../handler';

const getRecipePhoto: AuthenticatedRequestHandler = async ({ request, requestContext }) => {
  const recipeRepository = await requestContext.get('recipeRepository');

  const { id } = getRecipePhotoQuerySchema.parse(request.query);

  const recipePhotoFile = await recipeRepository.downloadPhotoFile(id);

  if (recipePhotoFile === null) {
    return {
      status: 404
    };
  }

  const { fileBuffer, contentType } = recipePhotoFile;

  return {
    body: fileBuffer,
    headers: {
      ...(contentType === null) ? {} : {
        'content-type': contentType
      }
    }
  };
};

app.http('getRecipePhoto', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: createAuthenticatedRequestHandler(appContext, getRecipePhoto)
});

const getRecipePhotoQuerySchema = zfd.formData({
  id: z.string().uuid(),
});
