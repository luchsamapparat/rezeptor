import { Hono } from 'hono';
import z from 'zod';

import { identifierSchema } from '../../../../application/model/identifier';
import { type ApplicationContext } from '../../../../application/server/di';
import { validator } from '../../../../common/server/validation';
import { recipeExtractionService, recipeFileRepository, recipePhotoFileRepository, recipeRepository } from '../../infrastructure/di';
import { addRecipe, addRecipeFromPhoto, addRecipePhoto, editRecipe, getRecipe, getRecipePhoto, getRecipes, removeRecipe } from '../../recipeManagement';

const recipePath = '/recipes';

const recipeIdentifierName = 'recipeId';
const recipeIdentifierPathSchema = z.object({ [recipeIdentifierName]: identifierSchema });

const recipeDtoSchema = z.object({
  title: z.string().min(1),
  instructions: z.string().min(1),
  ingredients: z.array(z.object({
    quantity: z.string().nullable(),
    unit: z.string().nullable(),
    name: z.string().min(1),
    notes: z.string().nullable(),
  })),
  photoFileId: z.string().nullable().optional(),
  recipeFileId: z.string().nullable().optional(),
  cookbookId: z.string().nullable().optional(),
  pageNumber: z.number().nullable().optional(),
});
const addRecipeDtoSchema = recipeDtoSchema;
const editRecipeDtoSchema = addRecipeDtoSchema.partial();

const addRecipeFromPhotoDtoSchema = z.object({
  cookbookId: z.string().nullable().optional(),
  recipeFile: z.instanceof(File),
}).refine(({ recipeFile }) => recipeFile.type.startsWith('image/'), {
  message: 'The uploaded file must be an image.',
});

const addRecipePhotoDtoSchema = z.object({
  photoFile: z.instanceof(File),
}).refine(({ photoFile }) => photoFile.type.startsWith('image/'), {
  message: 'The uploaded file must be an image.',
});

export const recipeApi = new Hono<{ Variables: ApplicationContext }>()
  .basePath(recipePath)
  .use(recipeRepository.middleware('recipeRepository'))
  .use(recipeFileRepository.middleware('recipeFileRepository'))
  .use(recipePhotoFileRepository.middleware('recipePhotoFileRepository'))
  .use(recipeExtractionService.middleware('recipeExtractionService'))
  .get(
    '/',
    async c => c.json(await getRecipes(c.var)),
  )
  .get(
    `/:${recipeIdentifierName}`,
    validator('param', recipeIdentifierPathSchema),
    async c => c.json(await getRecipe({
      ...c.var,
      recipeId: c.req.valid('param')[recipeIdentifierName],
    })),
  )
  .post(
    '/',
    validator('json', addRecipeDtoSchema),
    async c => c.json(await addRecipe({
      ...c.var,
      recipe: c.req.valid('json'),
    }), 201),
  )
  .post(
    '/from-photo',
    validator('form', addRecipeFromPhotoDtoSchema),
    async (c) => {
      const { recipeFile, cookbookId } = c.req.valid('form');
      return c.json(await addRecipeFromPhoto({
        ...c.var,
        recipeFile,
        cookbookId,
      }), 201);
    },
  )
  .patch(
    `/:${recipeIdentifierName}`,
    validator('param', recipeIdentifierPathSchema),
    validator('json', editRecipeDtoSchema),
    async c => c.json(await editRecipe({
      ...c.var,
      recipeId: c.req.valid('param')[recipeIdentifierName],
      recipeChanges: c.req.valid('json'),
    })),
  )
  .put(
    `/:${recipeIdentifierName}/photo`,
    validator('param', recipeIdentifierPathSchema),
    validator('form', addRecipePhotoDtoSchema),
    async (c) => {
      const { photoFile } = c.req.valid('form');
      return c.json(await addRecipePhoto({
        ...c.var,
        recipeId: c.req.valid('param')[recipeIdentifierName],
        photoFile,
      }));
    },
  )
  .get(
    `/:${recipeIdentifierName}/photo`,
    validator('param', recipeIdentifierPathSchema),
    async (c) => {
      const photoData = await getRecipePhoto({
        ...c.var,
        recipeId: c.req.valid('param')[recipeIdentifierName],
      });

      // Return the image with appropriate headers
      return c.body(photoData, 200, {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      });
    },
  )
  .delete(
    `/:${recipeIdentifierName}`,
    validator('param', recipeIdentifierPathSchema),
    async (c) => {
      await removeRecipe({
        ...c.var,
        recipeId: c.req.valid('param')[recipeIdentifierName],
      });
      return c.body(null, 204);
    },
  );
