import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type { NewCookbook } from '../../cookbookManagement';
import type { CookbookAuthorEntity } from '../../infrastructure/persistence/CookbookAuthorEntity';
import type { CookbookEntity, InsertCookbookEntity, UpdateCookbookEntity } from '../../infrastructure/persistence/CookbookEntity';
import type { AddCookbookDto, CookbookDto, EditCookbookDto } from '../../presentation/api/client';
import { cookbookAuthorEntityMockDataFactory, toCookbookAuthor } from './cookbookAuthorMockData';

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

export const toNewCookbook = (entity: CookbookEntity, authors: CookbookAuthorEntity[]): NewCookbook => {
  const { id, ...insertEntity } = entity;
  return {
    ...insertEntity,
    authors: authors.map(toCookbookAuthor),
  };
};

export const toUpdateCookbookEntity = (entity: CookbookEntity): UpdateCookbookEntity => {
  const { id, ...updateEntity } = entity;
  return updateEntity;
};

export const toCookbookDto = (entity: CookbookEntity, authors: CookbookAuthorEntity[]): CookbookDto => {
  return {
    ...entity,
    authors: authors.map(toCookbookAuthor),
  };
};

export const toAddCookbookDto = (entity: CookbookEntity, authors: CookbookAuthorEntity[]): AddCookbookDto => {
  const { id, ...addDto } = entity;
  return {
    ...addDto,
    authors: authors.map(toCookbookAuthor),
  };
};

export const toEditCookbookDto = (entity: CookbookEntity, authors: CookbookAuthorEntity[]): EditCookbookDto => {
  const { id, ...editDto } = entity;
  return {
    ...editDto,
    authors: authors.map(toCookbookAuthor),
  };
};

const authors = cookbookAuthorEntityMockDataFactory.buildList(faker.number.int({ min: 1, max: 3 }));

export const insertCookbookEntityMock = toInsertCookbookEntity(cookbookEntityMock);
export const newCookbookMock = toNewCookbook(cookbookEntityMock, authors);
export const updateCookbookEntityMock = toUpdateCookbookEntity(cookbookEntityMock);
export const cookbookDtoMock = toCookbookDto(cookbookEntityMock, authors);
export const addCookbookDtoMock = toAddCookbookDto(cookbookEntityMock, authors);
export const editCookbookDtoMock = toEditCookbookDto(cookbookEntityMock, authors);

export const addCookbookWithoutIsbnDtoMock = toAddCookbookDto(cookbookEntityMockDataFactory.build({
  isbn10: null,
  isbn13: null,
}), authors);
