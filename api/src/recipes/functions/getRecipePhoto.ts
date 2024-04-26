import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import type { AuthenticatedRequestHandler } from '../../handler';
import { createAuthenticatedRequestHandler } from '../../handler';

const getRecipePhoto: AuthenticatedRequestHandler = async ({ request, requestEnv }) => {
  const recipeRepository = await requestEnv.get('recipeRepository');

  const id = getStringValue(request.query, 'id');

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
  handler: createAuthenticatedRequestHandler(appEnvironment, getRecipePhoto)
});
