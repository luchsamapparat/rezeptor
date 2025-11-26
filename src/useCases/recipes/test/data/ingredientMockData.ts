import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import { toNumber, uniqueId } from 'lodash-es';
import type { IngredientEntity } from '../../infrastructure/persistence/IngredientEntity';
import type { Ingredient } from '../../recipeManagement';

export const ingredientEntityMockDataFactory = Factory.define<IngredientEntity>(() => {
  const quantity = faker.helpers.arrayElement(['1', '2', '1/2', '1/4', null]);
  return {
    id: faker.string.uuid(),
    name: faker.food.ingredient(),
    notes: faker.helpers.arrayElement([faker.lorem.sentence(), null]),
    quantity,
    unit: quantity === null ? null : faker.helpers.arrayElement(['cup', 'tsp', 'tbsp', 'oz']),
    recipeId: faker.string.uuid(),
    sortOrder: toNumber(uniqueId()),
  };
});

export const ingredientEntityMockList = ingredientEntityMockDataFactory.buildList(20);

export const toIngredient = (entity: IngredientEntity): Ingredient => {
  const { id, sortOrder, recipeId, ...ingredient } = entity;
  return ingredient;
};