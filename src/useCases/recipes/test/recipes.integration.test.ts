import { eq } from 'drizzle-orm';
import { omit, pick } from 'lodash-es';
import request from 'supertest';
import { describe, expect } from 'vitest';
import { databaseSchema } from '../../../bootstrap/databaseSchema';
import { beforeEach, it } from '../../../tests/integration.test';
import { RecipeRepository } from '../server/persistence/recipeRepository';
import { recipeMock, recipeMockDataFactory, recipeMockList } from './data/recipeMockData';

describe('Recipes API Integration Tests', () => {
  describe('GET /api/recipes', () => {
    it('should return empty array when no recipes exist', async ({ app }) => {
      // when:
      const response = await request(app)
        .get('/api/recipes')
        .expect(200);

      // then:
      expect(response.body).toEqual([]);
    });

    it('should return all recipes when they exist', async ({ app, database }) => {
      // given:
      const recipeRepository = new RecipeRepository(database);
      const recipe = recipeMock;

      await recipeRepository.insert(recipe);

      // when:
      const response = await request(app)
        .get('/api/recipes')
        .expect(200);

      // then:
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject(recipe);
      expect(response.body[0].id).toBeDefined();
    });
  });

  describe('GET /api/recipes/:id', () => {
    let recipeId: string;

    beforeEach(async ({ database }) => {
      const recipeRepository = new RecipeRepository(database);
      const [recipe] = await recipeRepository.insert(recipeMock);
      recipeId = recipe.id;
    });

    it('should return specific recipe when it exists', async ({ app }) => {
      // when:
      const response = await request(app)
        .get(`/api/recipes/${recipeId}`)
        .expect(200);

      // then:
      expect(response.body.id).toBe(recipeId);
      expect(response.body.title).toBeDefined();
      expect(response.body.content).toBeDefined();
    });
  });

  it('should return 404 for non-existent recipe', async ({ app }) => {
    await request(app)
      .get('/api/recipes/non-existent-id')
      .expect(404);
  });

  describe('POST /api/recipes', () => {
    it('should create a new recipe with valid data', async ({ app, database }) => {
      // given:
      const newRecipe = recipeMock;

      // when:
      const response = await request(app)
        .post('/api/recipes')
        .send(newRecipe)
        .expect(201);

      // then:
      expect(response.body[0]).toMatchObject(newRecipe);
      expect(response.body[0].id).toBeDefined();

      const recipes = await database.select().from(databaseSchema.recipesTable);
      expect(recipes).toHaveLength(1);
      expect(recipes[0]).toMatchObject(newRecipe);
    });

    it('should return 422 for invalid data', async ({ app }) => {
      // given:
      const invalidRecipe = {
        ...recipeMock,
        title: null,
      };

      // when/then:
      await request(app)
        .post('/api/recipes')
        .send(invalidRecipe)
        .expect(422);
    });

    it('should return 422 when required fields are missing', async ({ app }) => {
      // given:
      const incompleteRecipe = omit(recipeMock, 'title');

      // when/then:
      await request(app)
        .post('/api/recipes')
        .send(incompleteRecipe)
        .expect(422);
    });
  });

  describe('PATCH /api/recipes/:id', () => {
    let recipeId: string;

    beforeEach(async ({ database }) => {
      const recipeRepository = new RecipeRepository(database);
      const [recipe] = await recipeRepository.insertMany(recipeMockList);
      recipeId = recipe.id;
    });

    it('should update recipe with valid data', async ({ app, database }) => {
      // given:
      const recipeUpdate = pick(recipeMockDataFactory.build(), ['title', 'content']);

      // when:
      const response = await request(app)
        .patch(`/api/recipes/${recipeId}`)
        .send(recipeUpdate)
        .expect(200);

      // then:
      expect(response.body).toMatchObject(recipeUpdate);
      expect(response.body.id).toBe(recipeId);

      const [updatedRecipe] = await database.select().from(databaseSchema.recipesTable).where(eq(databaseSchema.recipesTable.id, recipeId));
      expect(updatedRecipe).toMatchObject(recipeUpdate);
    });

    it('should return 404 for non-existent recipe', async ({ app }) => {
      // given:
      const recipeUpdate = pick(recipeMockDataFactory.build(), ['title', 'content']);

      // when/then:
      await request(app)
        .patch('/api/recipes/non-existent-id')
        .send(recipeUpdate)
        .expect(404);
    });

    it('should return 422 for invalid update data', async ({ app }) => {
      // given:
      const invalidRecipeUpdate = { title: null };

      // when/then:
      await request(app)
        .patch(`/api/recipes/${recipeId}`)
        .send(invalidRecipeUpdate)
        .expect(422);
    });
  });

  describe('DELETE /api/recipes/:id', () => {
    let recipeId: string;

    beforeEach(async ({ database }) => {
      const recipeRepository = new RecipeRepository(database);
      const [recipe] = await recipeRepository.insertMany(recipeMockList);
      recipeId = recipe.id;
    });

    it('should delete existing recipe', async ({ app, database }) => {
      await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .expect(204);

      const recipes = await database.select().from(databaseSchema.recipesTable);
      expect(recipes).toHaveLength(recipeMockList.length - 1);
    });

    it('should return 404 for non-existent recipe', async ({ app }) => {
      await request(app)
        .delete('/api/recipes/non-existent-id')
        .expect(404);
    });
  });
});