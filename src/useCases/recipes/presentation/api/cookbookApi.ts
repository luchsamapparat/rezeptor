import { Hono } from 'hono';

import z from 'zod';
import { identifierSchema } from '../../../../application/model/identifier';
import { type ApplicationContext } from '../../../../application/server/di';
import { validator } from '../../../../common/server/validation';
import { addCookbook, editCookbook, getCookbook, getCookbooks, identifyCookbook, removeCookbook } from '../../cookbookManagement';
import { barcodeExtractionService, bookMetadataService, cookbookRepository } from '../../infrastructure/di';

const cookbookPath = '/cookbooks';

const cookbookIdentifierName = 'cookbookId';
const cookbookIdentifierPathSchema = z.object({ [cookbookIdentifierName]: identifierSchema });

const cookbookDtoSchema = z.object({
  title: z.string().min(1),
  authors: z.array(z.object({
    name: z.string().min(3),
  })),
  isbn10: z.string().nullable(),
  isbn13: z.string().nullable(),
});
const addCookbookDtoSchema = cookbookDtoSchema;
const editCookbookDtoSchema = addCookbookDtoSchema.partial();

const identifyCookbookDtoSchema = z.object({ backCoverFile: z.instanceof(File) })
  .refine(({ backCoverFile }) => backCoverFile.type.startsWith('image/'), {
    error: 'The uploaded file must be an image.',
  });

export const cookbookApi = new Hono<{ Variables: ApplicationContext }>()
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
    }), 200),
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