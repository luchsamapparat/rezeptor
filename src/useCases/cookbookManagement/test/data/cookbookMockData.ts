import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type {
  AddCookbookDto,
  EditCookbookDto,
} from '../../server/api/cookbookApiModel';
import type {
  CookbookEntity,
  InsertCookbookEntity,
  UpdateCookbookEntity,
} from '../../server/persistence/cookbookDatabaseModel';

export const cookbookEntityMockDataFactory = Factory.define<CookbookEntity>(() => ({
  id: faker.string.uuid(),
  title: faker.book.title(),
  authors: [faker.book.author(), faker.book.author()],
  isbn10: faker.commerce.isbn(10),
  isbn13: faker.commerce.isbn(13),
}));

export const cookbookEntityMockList = cookbookEntityMockDataFactory.buildList(5);
export const cookbookEntityMock = cookbookEntityMockList[0];

export const toInsertCookbookEntity = (entity: CookbookEntity): InsertCookbookEntity => {
  const { id, ...insertEntity } = entity;
  return insertEntity;
};

export const toUpdateCookbookEntity = (entity: CookbookEntity): UpdateCookbookEntity => {
  const { id, ...updateEntity } = entity;
  return updateEntity;
};

export const toAddCookbookDto = (entity: CookbookEntity): AddCookbookDto => {
  const { id, ...addDto } = entity;
  return addDto;
};

export const toEditCookbookDto = (entity: CookbookEntity): EditCookbookDto => {
  const { id, ...editDto } = entity;
  return editDto;
};

export const insertCookbookEntityMock = toInsertCookbookEntity(cookbookEntityMock);
export const updateCookbookEntityMock = toUpdateCookbookEntity(cookbookEntityMock);
export const addCookbookDtoMock = toAddCookbookDto(cookbookEntityMock);
export const editCookbookDtoMock = toEditCookbookDto(cookbookEntityMock);

export const addCookbookWithoutIsbnDtoMock = toAddCookbookDto(cookbookEntityMockDataFactory.build({
  isbn10: null,
  isbn13: null,
}));
