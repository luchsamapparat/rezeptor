import z from 'zod';
import { identifierSchema } from '../../../../application/model/identifier';
import { insertCookbookEntitySchema, updateCookbookEntitySchema } from '../persistence/cookbookDatabaseModel';

export const cookbooksPath = '/cookbooks';

export const cookbookIdentifierName = 'cookbookId';
export const cookbookIdentifierPathSchema = z.object({ [cookbookIdentifierName]: identifierSchema });

export const addCookbookDtoSchema = insertCookbookEntitySchema;
export type AddCookbookDto = z.infer<typeof addCookbookDtoSchema>;

export const editCookbookDtoSchema = updateCookbookEntitySchema;
export type EditCookbookDto = z.infer<typeof editCookbookDtoSchema>;