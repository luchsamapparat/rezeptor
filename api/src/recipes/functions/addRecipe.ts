import { app } from '@azure/functions';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { appEnvironment } from '../../appEnvironment';
import type { AuthenticatedRequestHandler } from '../../handler';
import { createAuthenticatedRequestHandler } from '../../handler';
import { extractDocumentContents } from '../infrastructure/api/azureDocumentIntelligence';

const addRecipe: AuthenticatedRequestHandler = async ({ request, env, requestEnv }) => {
  const recipeRepository = await requestEnv.get('recipeRepository');
  const documentAnalysisApi = env.get('documentAnalysisApi');

  const { cookbookId, recipeFile } = addRecipeRequestBodySchema.parse(await request.formData());

  const recipeFileId = await recipeRepository.uploadRecipeFile(recipeFile);

  const { title, pageNumber, content } = await extractDocumentContents(documentAnalysisApi, recipeFile);

  const { id: recipeId } = await recipeRepository.create({
    title: title ?? '',
    content,
    photoFileId: null,
    recipeFileId,
    cookbookId,
    pageNumber
  });

  return {
    body: recipeId
  };
};

app.http('addRecipe', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createAuthenticatedRequestHandler(appEnvironment, addRecipe)
});

const addRecipeRequestBodySchema = zfd.formData({
  cookbookId: z.string().uuid(),
  recipeFile: zfd.file()
});
