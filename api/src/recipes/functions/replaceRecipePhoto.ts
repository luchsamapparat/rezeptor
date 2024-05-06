import { app } from '@azure/functions';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { appEnvironment } from '../../appEnvironment';
import type { AuthenticatedRequestHandler } from '../../handler';
import { createAuthenticatedRequestHandler } from '../../handler';

const replaceRecipePhoto: AuthenticatedRequestHandler = async ({ request, requestEnv }) => {
  const recipeRepository = await requestEnv.get('recipeRepository');

  const { id, photoFile } = addReplaceRecipePhotoBodySchema.parse(await request.formData());

  const photoFileId = await recipeRepository.uploadPhotoFile(photoFile);

  await recipeRepository.update(id, {
    photoFileId
  });

  return {
    body: id
  };
};

app.http('replaceRecipePhoto', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createAuthenticatedRequestHandler(appEnvironment, replaceRecipePhoto)
});

const addReplaceRecipePhotoBodySchema = zfd.formData({
  id: z.string().uuid(),
  photoFile: zfd.file()
});
