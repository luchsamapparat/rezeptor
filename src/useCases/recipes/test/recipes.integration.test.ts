import { eq } from 'drizzle-orm';
import { omit, pick } from 'lodash-es';
import request from 'supertest';
import { describe, expect, vi } from 'vitest';
import { databaseSchema } from '../../../bootstrap/databaseSchema';
import { loadTestFile } from '../../../tests/data/testFile';
import { beforeEach, it } from '../../../tests/integration.test';
import { DocumentAnalysisClientMock, setupAzureFormRecognizerMock } from '../../../tests/mocks/azureAiFormRecognizer.mock';
import { RecipeRepository } from '../server/persistence/recipeRepository';
import { recipeMock, recipeMockDataFactory, recipeMockList } from './data/recipeMockData';

vi.mock('@azure/ai-form-recognizer', () => ({
  DocumentAnalysisClient: vi.fn().mockImplementation(() => DocumentAnalysisClientMock),
  AzureKeyCredential: vi.fn(),
}));

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

    it('should create a recipe from uploaded image file', async ({ app, database, fileSystemMock }) => {
      // given:
      // Create a cookbook first
      const cookbook = await database.insert(databaseSchema.cookbooksTable).values({
        id: crypto.randomUUID(),
        title: 'Test Cookbook',
        authors: ['Test Author'],
        isbn13: '978-0123456789',
      }).returning();
      const cookbookId = cookbook[0].id;

      // Setup the document analysis mock
      setupAzureFormRecognizerMock({
        title: 'Extracted Recipe Title',
        pageNumber: '123',
        text: 'Extracted recipe content with ingredients and instructions.',
      });

      const initialFileCount = fileSystemMock.getFileCount();

      // when:
      const response = await request(app)
        .post('/api/recipes')
        .attach('recipeFile', await loadTestFile('recipe1.jpg'), 'recipe1.jpg')
        .field('cookbookId', cookbookId)
        .expect(201);

      // then:
      expect(response.body[0]).toMatchObject({
        title: 'Extracted Recipe Title',
        content: 'Extracted recipe content with ingredients and instructions.',
        pageNumber: 123,
        cookbookId,
        photoFileId: null,
      });
      expect(response.body[0].id).toBeDefined();
      expect(response.body[0].recipeFileId).toBeDefined();

      expect(fileSystemMock.getFileCount()).toBe(initialFileCount + 1);
      expect(fileSystemMock.fileExists(`/data/recipes/${response.body[0].recipeFileId}`)).toBe(true);

      const recipes = await database.select().from(databaseSchema.recipesTable);
      expect(recipes).toHaveLength(1);
      expect(recipes[0].recipeFileId).not.toBeNull();
    });

    it('should create a recipe from uploaded image file without cookbook context', async ({ app, database }) => {
      // given:
      // Setup the document analysis mock
      setupAzureFormRecognizerMock({
        title: 'Another Recipe Title',
        pageNumber: '456',
        text: 'Another extracted recipe content.',
      });

      // when:
      const response = await request(app)
        .post('/api/recipes')
        .attach('recipeFile', await loadTestFile('recipe1.jpg'), 'recipe1.jpg')
        .expect(201);

      // then:
      expect(response.body[0]).toMatchObject({
        title: 'Another Recipe Title',
        content: 'Another extracted recipe content.',
        pageNumber: 456,
        cookbookId: null,
        photoFileId: null,
      });
      expect(response.body[0].id).toBeDefined();
      expect(response.body[0].recipeFileId).toBeDefined();

      const recipes = await database.select().from(databaseSchema.recipesTable);
      expect(recipes).toHaveLength(1);
      expect(recipes[0].recipeFileId).not.toBeNull();
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

    it('should delete recipe files when recipe is deleted', async ({ app, database, fileSystemMock }) => {
      // given: create a recipe with both photo and recipe files

      // First create a recipe with a recipe file
      setupAzureFormRecognizerMock({
        title: 'Test Recipe',
        pageNumber: '1',
        text: 'Test recipe content.',
      });

      const createResponse = await request(app)
        .post('/api/recipes')
        .attach('recipeFile', await loadTestFile('recipe1.jpg'), 'recipe1.jpg')
        .expect(201);

      const createdRecipeId = createResponse.body[0].id;
      const recipeFileId = createResponse.body[0].recipeFileId;

      // Add a photo to the recipe
      const photoResponse = await request(app)
        .put(`/api/recipes/${createdRecipeId}/photo`)
        .attach('photoFile', await loadTestFile('recipe2.jpg'), 'recipe2.jpg')
        .expect(200);

      const photoFileId = photoResponse.body.photoFileId;

      // Verify files exist
      expect(fileSystemMock.fileExists(`/data/recipes/${recipeFileId}`)).toBe(true);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${photoFileId}`)).toBe(true);

      // when: delete the recipe
      await request(app)
        .delete(`/api/recipes/${createdRecipeId}`)
        .expect(204);

      // then: verify recipe is deleted from database
      const recipes = await database.select().from(databaseSchema.recipesTable).where(eq(databaseSchema.recipesTable.id, createdRecipeId));
      expect(recipes).toHaveLength(0);

      // and: verify files are also deleted
      expect(fileSystemMock.fileExists(`/data/recipes/${recipeFileId}`)).toBe(false);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${photoFileId}`)).toBe(false);
    });

    it('should delete recipe without files gracefully', async ({ app, database }) => {
      // given: create a recipe without any files (manually inserted)
      const recipeRepository = new RecipeRepository(database);
      const [recipe] = await recipeRepository.insert({
        title: 'Test Recipe Without Files',
        content: 'Simple recipe content',
        cookbookId: null,
        pageNumber: null,
        photoFileId: null,
        recipeFileId: null,
      });

      // when: delete the recipe
      await request(app)
        .delete(`/api/recipes/${recipe.id}`)
        .expect(204);

      // then: verify recipe is deleted from database
      const recipes = await database.select().from(databaseSchema.recipesTable).where(eq(databaseSchema.recipesTable.id, recipe.id));
      expect(recipes).toHaveLength(0);
    });
  });

  describe('PUT /api/recipes/:id/photo', () => {
    let recipeId: string;

    beforeEach(async ({ database }) => {
      const recipeRepository = new RecipeRepository(database);
      const [recipe] = await recipeRepository.insert(recipeMock);
      recipeId = recipe.id;
    });

    it('should add photo to existing recipe', async ({ app, database, fileSystemMock }) => {
      // given:
      const initialFileCount = fileSystemMock.getFileCount();

      // when:
      const response = await request(app)
        .put(`/api/recipes/${recipeId}/photo`)
        .attach('photoFile', await loadTestFile('recipe1.jpg'), 'recipe1.jpg')
        .expect(200);

      // then:
      expect(response.body.id).toBe(recipeId);
      expect(response.body.photoFileId).toBeDefined();
      expect(response.body.photoFileId).not.toBeNull();

      expect(fileSystemMock.getFileCount()).toBe(initialFileCount + 1);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${response.body.photoFileId}`)).toBe(true);

      const [updatedRecipe] = await database.select().from(databaseSchema.recipesTable).where(eq(databaseSchema.recipesTable.id, recipeId));
      expect(updatedRecipe.photoFileId).not.toBeNull();
    });

    it('should replace existing photo', async ({ app, database }) => {
      // given: recipe with existing photo - first upload a photo
      const firstUploadResponse = await request(app)
        .put(`/api/recipes/${recipeId}/photo`)
        .attach('photoFile', await loadTestFile('recipe1.jpg'), 'recipe1.jpg')
        .expect(200);

      const existingPhotoFileId = firstUploadResponse.body.photoFileId;

      // when: upload a different photo to replace the existing one
      const response = await request(app)
        .put(`/api/recipes/${recipeId}/photo`)
        .attach('photoFile', await loadTestFile('recipe2.jpg'), 'recipe2.jpg')
        .expect(200);

      // then:
      expect(response.body.id).toBe(recipeId);
      expect(response.body.photoFileId).toBeDefined();
      expect(response.body.photoFileId).not.toBe(existingPhotoFileId);

      const [updatedRecipe] = await database.select().from(databaseSchema.recipesTable).where(eq(databaseSchema.recipesTable.id, recipeId));
      expect(updatedRecipe.photoFileId).not.toBe(existingPhotoFileId);
    });

    it('should return 404 for non-existent recipe', async ({ app }) => {
      await request(app)
        .put('/api/recipes/non-existent-id/photo')
        .attach('photoFile', await loadTestFile('recipe1.jpg'), 'recipe1.jpg')
        .expect(404);
    });

    it('should return 422 when no photo file is provided', async ({ app }) => {
      await request(app)
        .put(`/api/recipes/${recipeId}/photo`)
        .expect(422);
    });

    it('should return 422 for invalid file type', async ({ app }) => {
      await request(app)
        .put(`/api/recipes/${recipeId}/photo`)
        .attach('photoFile', Buffer.from('not an image'), 'test.txt')
        .expect(422);
    });
  });
});