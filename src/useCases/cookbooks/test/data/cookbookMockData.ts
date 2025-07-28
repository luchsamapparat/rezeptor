import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type { z } from 'zod';
import type { insertCookbookSchema } from '../../server/persistence/cookbooksTable';

type CookbookInsert = z.infer<typeof insertCookbookSchema>;

export const cookbookMockDataFactory = Factory.define<CookbookInsert>(() => ({
  title: faker.book.title(),
  authors: [faker.book.author(), faker.book.author()],
  isbn10: faker.commerce.isbn(10),
  isbn13: faker.commerce.isbn(13),
}));

export const cookbookMockList = cookbookMockDataFactory.buildList(5);
export const cookbookMock = cookbookMockList[0];

export const cookbookWithoutIsbnMock = cookbookMockDataFactory.build({
  isbn10: null,
  isbn13: null,
});