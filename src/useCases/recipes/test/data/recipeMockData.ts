import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type { z } from 'zod';
import type { insertRecipeSchema } from '../../server/persistence/recipesTable';

type RecipeInsert = z.infer<typeof insertRecipeSchema>;

export const recipeMockDataFactory = Factory.define<RecipeInsert>(() => ({
  title: faker.lorem.words({ min: 2, max: 5 }),
  content: faker.lorem.paragraphs({ min: 2, max: 4 }),
  cookbookId: null,
  pageNumber: faker.number.int({ min: 1, max: 500 }),
  photoFileId: null,
  recipeFileId: null,
}));

export const recipeMockList = recipeMockDataFactory.buildList(10);
export const recipeMock = recipeMockList[0];
