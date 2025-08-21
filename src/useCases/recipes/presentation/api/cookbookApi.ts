import { Hono } from 'hono';

import z from 'zod';
import { identifierSchema } from '../../../../application/model/identifier';
import { database, dependency, type ApplicationContext } from '../../../../application/server/di';
import { validator } from '../../../../common/server/validation';
import { addCookbook, editCookbook, getCookbook, getCookbooks, identifyCookbook, removeCookbook } from '../../cookbookManagement';
import { AzureDocumentAnalysisClient } from '../../infrastructure/AzureDocumentAnalysisClient';
import { GoogleBooksClient } from '../../infrastructure/GoogleBooksClient';
import { CookbookDatabaseRepository } from '../../infrastructure/persistence/CookbookDatabaseRepository';
import type { RecipesDatabaseSchema } from '../../infrastructure/persistence/recipeDatabaseModel';

const cookbookPath = '/cookbooks';

const cookbookIdentifierName = 'cookbookId';
const cookbookIdentifierPathSchema = z.object({ [cookbookIdentifierName]: identifierSchema });

const cookbookDtoSchema = z.object({
  title: z.string().min(1),
  authors: z.array(z.string().min(1)),
  isbn10: z.string().nullable(),
  isbn13: z.string().nullable(),
});
const addCookbookDtoSchema = cookbookDtoSchema;
const editCookbookDtoSchema = addCookbookDtoSchema.partial();

const identifyCookbookDtoSchema = z.object({ backCoverFile: z.instanceof(File) })
  .refine(({ backCoverFile }) => backCoverFile.type.startsWith('image/'), {
    error: 'The uploaded file must be an image.',
  });

const cookbookRepository = dependency(async (_, c) => new CookbookDatabaseRepository(await database<RecipesDatabaseSchema>().resolve(c)), 'request');
const bookMetadataService = dependency(env => new GoogleBooksClient(env.googleBooks));
const barcodeExtractionService = dependency(env => new AzureDocumentAnalysisClient(env.azureDocumentAnalysis));

export const cookbookApi = new Hono<{ Variables: ApplicationContext<RecipesDatabaseSchema> }>()
  .basePath(cookbookPath)
  .use(cookbookRepository.middleware('cookbookRepository'))
  .use(bookMetadataService.middleware('bookMetadataService'))
  .use(barcodeExtractionService.middleware('barcodeExtractionService'))
  .get(
    '/',
    async c => c.json(await getCookbooks(c.var)),
  )
  .get(
    `/:${cookbookIdentifierName}`,
    validator('param', cookbookIdentifierPathSchema),
    async c => c.json(await getCookbook({
      ...c.var,
      cookbookId: c.req.valid('param')[cookbookIdentifierName],
    })),
  )
  .post(
    `/`,
    validator('json', addCookbookDtoSchema),
    async c => c.json(await addCookbook({
      ...c.var,
      cookbook: c.req.valid('json'),
    }), 201),
  )
  .post(
    `/identification`,
    validator('form', identifyCookbookDtoSchema),
    async c => c.json(await identifyCookbook({
      ...c.var,
      backCoverFile: c.req.valid('form').backCoverFile,
    }), 201),
  )
  .patch(
    `/:${cookbookIdentifierName}`,
    validator('param', cookbookIdentifierPathSchema),
    validator('json', editCookbookDtoSchema),
    async c => c.json(await editCookbook({
      ...c.var,
      cookbookId: c.req.valid('param')[cookbookIdentifierName],
      cookbookChanges: c.req.valid('json'),
    })),
  )
  .delete(
    `/:${cookbookIdentifierName}`,
    validator('param', cookbookIdentifierPathSchema),
    async (c) => {
      await removeCookbook({
        ...c.var,
        cookbookId: c.req.valid('param')[cookbookIdentifierName],
      });
      return c.body(null, 204);
    },
  );