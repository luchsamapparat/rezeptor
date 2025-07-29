import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type {
  AddFromPhotoRecipeDto,
  AddRecipeDto,
  EditRecipeDto,
} from '../../server/api/recipeApiModel';
import type {
  InsertRecipeEntity,
  RecipeEntity,
  UpdateRecipeEntity,
} from '../../server/persistence/recipeDatabaseModel';

export const recipeEntityMockDataFactory = Factory.define<RecipeEntity>(() => ({
  id: faker.string.uuid(),
  title: faker.lorem.words({ min: 2, max: 5 }),
  content: faker.lorem.paragraphs({ min: 2, max: 4 }),
  cookbookId: null,
  pageNumber: faker.number.int({ min: 1, max: 500 }),
  photoFileId: faker.string.uuid(),
  recipeFileId: faker.string.uuid(),
}));

export const addFromPhotoRecipeDtoMockDataFactory = Factory.define<AddFromPhotoRecipeDto>(() => ({
  cookbookId: faker.string.uuid(),
}));

export const recipeEntityMockList = recipeEntityMockDataFactory.buildList(10);
export const recipeEntityMock = recipeEntityMockList[0];

export const toInsertRecipeEntity = (entity: RecipeEntity): InsertRecipeEntity => {
  const { id, ...insertEntity } = entity;
  return insertEntity;
};

export const toUpdateRecipeEntity = (entity: RecipeEntity): UpdateRecipeEntity => {
  const { id, ...updateEntity } = entity;
  return updateEntity;
};

export const toAddRecipeDto = (entity: RecipeEntity): AddRecipeDto => {
  const { id, ...addDto } = entity;
  return addDto;
};

export const toEditRecipeDto = (entity: RecipeEntity): EditRecipeDto => {
  const { id, ...editDto } = entity;
  return editDto;
};

export const insertRecipeEntityMock = toInsertRecipeEntity(recipeEntityMock);
export const updateRecipeEntityMock = toUpdateRecipeEntity(recipeEntityMock);
export const addRecipeDtoMock = toAddRecipeDto(recipeEntityMock);
export const editRecipeDtoMock = toEditRecipeDto(recipeEntityMock);

export const addFromPhotoRecipeDtoMock = addFromPhotoRecipeDtoMockDataFactory.build();
