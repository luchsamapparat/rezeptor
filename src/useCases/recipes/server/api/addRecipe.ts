import { createContentTypeRouter } from '../../../../common/server/contentTypeRouter';
import { createRequestHandler } from '../../../../common/server/requestHandler';
import { recipesContext } from '../recipesContext';
import { addFromPhotoRecipeDtoSchema, addRecipeDtoSchema, type AddRecipeDto } from './recipeApiModel';

const addRecipeFromData = createRequestHandler(
  {
    requestBodySchema: addRecipeDtoSchema,
  },
  async (request, response) => {
    const { recipesRepository } = recipesContext.get();

    try {
      const recipe = await recipesRepository.insert(request.body);
      response.status(201).json(recipe);
    }
    catch (error) {
      console.error('Error adding recipe manually:', error);
      response.status(500).json({
        error: 'Failed to add recipe. Please try again.',
      });
    }
  },
);

const addRecipeFromPhoto = createRequestHandler(
  {
    requestBodySchema: addFromPhotoRecipeDtoSchema,
    fileUpload: {
      fieldName: 'recipeFile',
      required: true,
      acceptedMimeTypes: ['image/*'],
      maxSize: 5 * 1024 * 1024, // 5MB
    },
  },
  async (request, response) => {
    const { recipesRepository, recipeFileRepository, documentAnalysisClient } = recipesContext.get();

    try {
      const documentContents = await documentAnalysisClient.extractDocumentContents(request.file);
      const recipeFileId = await recipeFileRepository.save(new Uint8Array(await request.file.arrayBuffer()));

      const recipeData: AddRecipeDto = {
        title: documentContents.title || '',
        content: documentContents.content,
        pageNumber: documentContents.pageNumber,
        recipeFileId,
        cookbookId: request.body.cookbookId || null,
        photoFileId: null,
      };

      const recipe = await recipesRepository.insert(recipeData);
      response.status(201).json(recipe);
    }
    catch (error) {
      console.error('Error adding recipe from file:', error);
      response.status(500).json({
        error: 'Failed to add recipe. Please try again.',
      });
    }
  },
);

export const addRecipe = createContentTypeRouter({
  'application/json': addRecipeFromData,
  'multipart/form-data': addRecipeFromPhoto,
});
