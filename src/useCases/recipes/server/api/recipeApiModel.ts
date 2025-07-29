import z from 'zod';
import { identifierSchema } from '../../../../application/model/identifier';
import { insertRecipeEntitySchema, updateRecipeEntitySchema } from '../persistence/recipeDatabaseModel';

export const recipesPath = '/recipes';

export const recipeIdentifierName = 'recipeId';
export const recipeIdentifierPathSchema = z.object({ [recipeIdentifierName]: identifierSchema });

export const addRecipeDtoSchema = insertRecipeEntitySchema;
export type AddRecipeDto = z.infer<typeof addRecipeDtoSchema>;

export const addFromPhotoRecipeDtoSchema = insertRecipeEntitySchema.pick({ cookbookId: true });
export type AddFromPhotoRecipeDto = z.infer<typeof addFromPhotoRecipeDtoSchema>;

export const editRecipeDtoSchema = updateRecipeEntitySchema;
export type EditRecipeDto = z.infer<typeof editRecipeDtoSchema>;