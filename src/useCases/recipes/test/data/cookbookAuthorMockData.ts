import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import { toNumber, uniqueId } from 'lodash-es';
import type { CookbookAuthor } from '../../cookbookManagement';
import type { CookbookAuthorEntity } from '../../infrastructure/persistence/CookbookAuthorEntity';

export const cookbookAuthorEntityMockDataFactory = Factory.define<CookbookAuthorEntity>(() => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  cookbookId: faker.string.uuid(),
  sortOrder: toNumber(uniqueId()),
}));

export const cookbookAuthorEntityMockList = cookbookAuthorEntityMockDataFactory.buildList(20);

export const toCookbookAuthor = (entity: CookbookAuthorEntity): CookbookAuthor => {
  const { id, sortOrder, cookbookId, ...cookbookAuthor } = entity;
  return cookbookAuthor;
};