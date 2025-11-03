import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type { InsertRecipeEntity, RecipeEntity, UpdateRecipeEntity } from '../../infrastructure/persistence/recipesTable';
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

export const toNewRecipe = (entity: RecipeEntity): NewRecipe => {
  const { id, ...insertEntity } = entity;
  return {
    ...insertEntity,
    ingredients: ingredientEntityMockDataFactory.buildList(faker.number.int({ min: 3, max: 10 })).map(toIngredient),
  };
};

export const toUpdateRecipeEntity = (entity: RecipeEntity): UpdateRecipeEntity => {
  const { id, ...updateEntity } = entity;
  return updateEntity;
};

export const addFromPhotoRecipeDtoMockDataFactory = Factory.define<Omit<AddFromPhotoRecipeDto, 'recipeFile'>>(() => ({
  cookbookId: faker.string.uuid(),
}));

export const toAddRecipeDto = (entity: RecipeEntity): AddRecipeDto => {
  const { id, ...rest } = entity;
  return {
    ...rest,
    ingredients: ingredientEntityMockDataFactory.buildList(faker.number.int({ min: 3, max: 10 })).map(toIngredient),
  };
};

export const toEditRecipeDto = (entity: RecipeEntity): EditRecipeDto => {
  const { id, ...rest } = entity;
  return {
    ...rest,
    ingredients: ingredientEntityMockDataFactory.buildList(faker.number.int({ min: 3, max: 10 })).map(toIngredient),
  };
};

export const insertRecipeEntityMock = toInsertRecipeEntity(recipeEntityMock);
export const newRecipeMock = toNewRecipe(recipeEntityMock);
export const updateRecipeEntityMock = toUpdateRecipeEntity(recipeEntityMock);
export const addRecipeDtoMock = toAddRecipeDto(recipeEntityMock);
export const editRecipeDtoMock = toEditRecipeDto(recipeEntityMock);

export const addFromPhotoRecipeDtoMock = addFromPhotoRecipeDtoMockDataFactory.build();
