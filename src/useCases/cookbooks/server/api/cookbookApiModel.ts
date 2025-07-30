import { z } from '../../../../common/server/openapi/zodOpenApi';
import { identifierSchema } from '../../../../application/model/identifier';
import { insertCookbookEntitySchema, updateCookbookEntitySchema } from '../persistence/cookbookDatabaseModel';

export const cookbooksPath = '/cookbooks';

export const cookbookIdentifierName = 'cookbookId';
export const cookbookIdentifierPathSchema = z.object({ [cookbookIdentifierName]: identifierSchema });

export const addCookbookDtoSchema = insertCookbookEntitySchema.openapi({
  example: {
    title: 'Italian Classics',
    description: 'A collection of traditional Italian recipes',
  },
});
export type AddCookbookDto = z.infer<typeof addCookbookDtoSchema>;

export const editCookbookDtoSchema = updateCookbookEntitySchema.openapi({
  example: {
    title: 'Updated Italian Classics',
    description: 'An updated collection of traditional Italian recipes',
  },
});
export type EditCookbookDto = z.infer<typeof editCookbookDtoSchema>;