import { Hono } from 'hono';
import z from 'zod';

import { identifierSchema } from '../../../application/model/identifier';
import { database, dependency, fileRepositoryFactory, type ApplicationContext } from '../../../application/server/di';
import { validator } from '../../../common/server/validation';
import { addRecipe, addRecipeFromPhoto, addRecipePhoto, editRecipe, getRecipe, getRecipes, removeRecipe } from './application/recipes';
import type { RecipesDatabaseSchema } from './persistence/recipeDatabaseModel';
import { RecipeRepository } from './persistence/recipeRepository';

const recipesPath = '/recipes';

const recipeIdentifierName = 'recipeId';
const recipeIdentifierPathSchema = z.object({ [recipeIdentifierName]: identifierSchema });

const recipeDtoSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
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

const recipesRepository = dependency(async (_, c) => new RecipeRepository(await database<RecipesDatabaseSchema>().resolve(c)), 'request');
const recipeFileRepository = dependency(async (_, c) => {
  const factory = await fileRepositoryFactory.resolve(c);
  return factory.createFileRepository('recipes');
}, 'request');
const recipePhotoFileRepository = dependency(async (_, c) => {
  const factory = await fileRepositoryFactory.resolve(c);
  return factory.createFileRepository('recipePhotos');
}, 'request');

export const recipesApi = new Hono<{ Variables: ApplicationContext<RecipesDatabaseSchema> }>()
  .basePath(recipesPath)
  .use(recipesRepository.middleware('recipesRepository'))
  .use(recipeFileRepository.middleware('recipeFileRepository'))
  .use(recipePhotoFileRepository.middleware('recipePhotoFileRepository'))
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
