import { Hono } from 'hono';
import z from 'zod';

import { identifierSchema } from '../../../../application/model/identifier';
import { type ApplicationContext } from '../../../../application/server/di';
import { validator } from '../../../../common/server/validation';
import { recipeExtractionService, recipeFileRepository, foodPhotoFileRepository, recipeRepository } from '../../infrastructure/di';
import { addRecipe, addRecipeFromPhoto, addRecipeFromRecipe, addFoodPhoto, completeRecipeFromRecipe, editRecipe, getRecipe, getFoodPhoto, getRecipes, removeRecipe } from '../../recipeManagement';

const recipePath = '/recipes';

const recipeIdentifierName = 'recipeId';
const recipeIdentifierPathSchema = z.object({ [recipeIdentifierName]: identifierSchema });
const foodPhotoQuerySchema = z.object({ variant: z.enum(['preview', 'display']).default('display') });

const recipeDtoSchema = z.object({
  title: z.string().min(1),
  instructions: z.string().trim().min(1).nullable(),
  ingredients: z.array(z.object({
    quantity: z.string().nullable(),
    unit: z.string().nullable(),
    name: z.string().min(1),
    notes: z.string().nullable(),
  })),
  cookbookId: identifierSchema.nullable().optional(),
  pageNumber: z.number().int().positive().nullable().optional(),
});
const addRecipeDtoSchema = recipeDtoSchema;
const editRecipeDtoSchema = addRecipeDtoSchema.partial();

const imageFileSchema = z.instanceof(File).refine(file => file.type.startsWith('image/'), 'The uploaded file must be an image.');
const addRecipeFromRecipeDtoSchema = z.object({ cookbookId: identifierSchema, recipeFile: imageFileSchema });
const addRecipeFromPhotoDtoSchema = z.object({ title: z.string().trim().min(1), photoFile: imageFileSchema });
const completeRecipeFromRecipeDtoSchema = addRecipeFromRecipeDtoSchema;

const addFoodPhotoDtoSchema = z.object({
  photoFile: imageFileSchema,
});

export const recipeApi = new Hono<{ Variables: ApplicationContext }>()
  .basePath(recipePath)
  .use(recipeRepository.middleware('recipeRepository'))
  .use(recipeFileRepository.middleware('recipeFileRepository'))
  .use(foodPhotoFileRepository.middleware('foodPhotoFileRepository'))
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
    '/from-recipe',
    validator('form', addRecipeFromRecipeDtoSchema),
    async (c) => {
      const { recipeFile, cookbookId } = c.req.valid('form');
      return c.json(await addRecipeFromRecipe({
        ...c.var,
        recipeFile,
        cookbookId,
      }), 201);
    },
  )
  .post(
    '/from-photo',
    validator('form', addRecipeFromPhotoDtoSchema),
    async (c) => {
      const { title, photoFile } = c.req.valid('form');
      return c.json(await addRecipeFromPhoto({ ...c.var, title, photoFile }), 201);
    },
  )
  .post(
    `/:${recipeIdentifierName}/from-recipe`,
    validator('param', recipeIdentifierPathSchema),
    validator('form', completeRecipeFromRecipeDtoSchema),
    async (c) => {
      const { cookbookId, recipeFile } = c.req.valid('form');
      return c.json(await completeRecipeFromRecipe({
        ...c.var,
        recipeId: c.req.valid('param')[recipeIdentifierName],
        cookbookId,
        recipeFile,
      }));
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
    validator('form', addFoodPhotoDtoSchema),
    async (c) => {
      const { photoFile } = c.req.valid('form');
      return c.json(await addFoodPhoto({
        ...c.var,
        recipeId: c.req.valid('param')[recipeIdentifierName],
        photoFile,
      }));
    },
  )
  .get(
    `/:${recipeIdentifierName}/photo`,
    validator('param', recipeIdentifierPathSchema),
    validator('query', foodPhotoQuerySchema),
    async (c) => {
      const photoData = await getFoodPhoto({
        ...c.var,
        recipeId: c.req.valid('param')[recipeIdentifierName],
        variant: c.req.valid('query').variant,
      });

      // Return the image with appropriate headers
      return c.body(photoData, 200, {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
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
