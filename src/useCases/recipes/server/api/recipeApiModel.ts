import { z } from '../../../../common/server/openapi/zodOpenApi';
import { identifierSchema } from '../../../../application/model/identifier';
import { insertRecipeEntitySchema, updateRecipeEntitySchema } from '../persistence/recipeDatabaseModel';

export const recipesPath = '/recipes';

export const recipeIdentifierName = 'recipeId';
export const recipeIdentifierPathSchema = z.object({ [recipeIdentifierName]: identifierSchema });

export const addRecipeDtoSchema = insertRecipeEntitySchema.openapi({
  example: {
    title: 'Pasta Carbonara',
    description: 'Classic Italian pasta dish with eggs, cheese, and bacon',
    cookbookId: '123e4567-e89b-12d3-a456-426614174000',
  },
});
export type AddRecipeDto = z.infer<typeof addRecipeDtoSchema>;

export const addFromPhotoRecipeDtoSchema = insertRecipeEntitySchema.pick({ cookbookId: true }).openapi({
  example: {
    cookbookId: '123e4567-e89b-12d3-a456-426614174000',
  },
});
export type AddFromPhotoRecipeDto = z.infer<typeof addFromPhotoRecipeDtoSchema>;

export const editRecipeDtoSchema = updateRecipeEntitySchema.openapi({
  example: {
    title: 'Updated Pasta Carbonara',
    description: 'Updated classic Italian pasta dish',
  },
});
export type EditRecipeDto = z.infer<typeof editRecipeDtoSchema>;