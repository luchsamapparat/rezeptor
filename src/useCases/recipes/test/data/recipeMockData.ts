import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type { IngredientEntity } from '../../infrastructure/persistence/IngredientEntity';
import type { InsertRecipeEntity, RecipeEntity, UpdateRecipeEntity } from '../../infrastructure/persistence/RecipeEntity';
import type { AddFromPhotoRecipeDto, AddRecipeDto, EditRecipeDto } from '../../presentation/api/client';
import type { NewRecipe } from '../../recipeManagement';
import { ingredientEntityMockDataFactory, toIngredient } from './ingredientMockData';

export const recipeEntityMockDataFactory = Factory.define<RecipeEntity>(() => ({
  id: faker.string.uuid(),
  title: faker.lorem.words({ min: 2, max: 5 }),
  instructions: faker.lorem.paragraphs({ min: 2, max: 4 }),
  cookbookId: null,
  pageNumber: faker.number.int({ min: 1, max: 500 }),
  photoFileId: faker.string.uuid(),
  recipeFileId: faker.string.uuid(),
}));

export const recipeEntityMockList = recipeEntityMockDataFactory.buildList(10);
export const recipeEntityMock = recipeEntityMockList[0];

export const toInsertRecipeEntity = (entity: RecipeEntity): InsertRecipeEntity => {
  const { id, ...insertEntity } = entity;
  return insertEntity;
};

export const toNewRecipe = (entity: RecipeEntity, ingredients: IngredientEntity[]): NewRecipe => {
  const { id, ...insertEntity } = entity;
  return {
    ...insertEntity,
    ingredients: ingredients.map(toIngredient),
  };
};

export const toUpdateRecipeEntity = (entity: RecipeEntity): UpdateRecipeEntity => {
  const { id, ...updateEntity } = entity;
  return updateEntity;
};

export const addFromPhotoRecipeDtoMockDataFactory = Factory.define<Omit<AddFromPhotoRecipeDto, 'recipeFile'>>(() => ({
  cookbookId: faker.string.uuid(),
}));

export const toAddRecipeDto = (entity: RecipeEntity, ingredients: IngredientEntity[]): AddRecipeDto => {
  const { id, ...addDto } = entity;
  return {
    ...addDto,
    ingredients: ingredients.map(toIngredient),
  };
};

export const toEditRecipeDto = (entity: RecipeEntity, ingredients: IngredientEntity[]): EditRecipeDto => {
  const { id, ...editDto } = entity;
  return {
    ...editDto,
    ingredients: ingredients.map(toIngredient),
  };
};

const ingredients = ingredientEntityMockDataFactory.buildList(faker.number.int({ min: 3, max: 10 }));

export const insertRecipeEntityMock = toInsertRecipeEntity(recipeEntityMock);
export const newRecipeMock = toNewRecipe(recipeEntityMock, ingredients);
export const updateRecipeEntityMock = toUpdateRecipeEntity(recipeEntityMock);
export const addRecipeDtoMock = toAddRecipeDto(recipeEntityMock, ingredients);
export const editRecipeDtoMock = toEditRecipeDto(recipeEntityMock, ingredients);

export const addFromPhotoRecipeDtoMock = addFromPhotoRecipeDtoMockDataFactory.build();
