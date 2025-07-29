import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import { omit } from 'lodash-es';
import request from 'supertest';
import { describe, expect, vi } from 'vitest';
import { databaseSchema } from '../../../bootstrap/databaseSchema';
import { loadTestFile } from '../../../tests/data/testFile';
import { beforeEach, it } from '../../../tests/integration.test';
import { DocumentAnalysisClientMock, setupAzureFormRecognizerMock } from '../../../tests/mocks/azureAiFormRecognizer.mock';
import { CookbookRepository } from '../../cookbooks/server/persistence/cookbookRepository';
import { insertCookbookEntityMock } from '../../cookbooks/test/data/cookbookMockData';
import { RecipeRepository } from '../server/persistence/recipeRepository';
import { addRecipeDtoMock, insertRecipeEntityMock, recipeEntityMock, recipeEntityMockDataFactory, recipeEntityMockList, toEditRecipeDto, toInsertRecipeEntity } from './data/recipeMockData';

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
      const insertRecipeEntity = insertRecipeEntityMock;

      await recipeRepository.insert(insertRecipeEntity);

      // when:
      const response = await request(app)
        .get('/api/recipes')
        .expect(200);

      // then:
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject(insertRecipeEntity);
      expect(response.body[0].id).toBeDefined();
    });
  });

  describe('GET /api/recipes/:id', () => {
    let recipeId: string;

    beforeEach(async ({ database }) => {
      const recipeRepository = new RecipeRepository(database);
      const [recipeEntity] = await recipeRepository.insert(insertRecipeEntityMock);
      recipeId = recipeEntity.id;
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
      .get(`/api/recipes/${faker.string.uuid()}`)
      .expect(404);
  });

  describe('POST /api/recipes', () => {
    it('should create a new recipe with valid data', async ({ app, database }) => {
      // given:
      const addRecipeDto = addRecipeDtoMock;

      // when:
      const response = await request(app)
        .post('/api/recipes')
        .send(addRecipeDto)
        .expect(201);

      // then:
      expect(response.body[0]).toMatchObject(addRecipeDto);
      expect(response.body[0].id).toBeDefined();

      const recipes = await database.select().from(databaseSchema.recipesTable);
      expect(recipes).toHaveLength(1);
      expect(recipes[0]).toMatchObject(addRecipeDto);
    });

    it('should return 422 for invalid data', async ({ app }) => {
      // given:
      const invalidAddRecipeDto = {
        ...addRecipeDtoMock,
        title: null,
      };

      // when/then:
      await request(app)
        .post('/api/recipes')
        .send(invalidAddRecipeDto)
        .expect(422);
    });

    it('should return 422 when required fields are missing', async ({ app }) => {
      // given:
      const incompleteAddRecipeDto = omit(addRecipeDtoMock, 'title');

      // when/then:
      await request(app)
        .post('/api/recipes')
        .send(incompleteAddRecipeDto)
        .expect(422);
    });

    it('should create a recipe from uploaded image file', async ({ app, database, fileSystemMock }) => {
      // given:
      // Create a cookbook first
      const cookbookRepository = new CookbookRepository(database);
      const [cookbookEntity] = await cookbookRepository.insert(insertCookbookEntityMock);
      const cookbookId = cookbookEntity.id;

      const { title, pageNumber, content } = recipeEntityMock;

      // Setup the document analysis mock
      setupAzureFormRecognizerMock({
        title,
        pageNumber: pageNumber?.toString(),
        text: content,
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
        title,
        content,
        pageNumber,
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
      const { title, pageNumber, content } = recipeEntityMock;
      setupAzureFormRecognizerMock({
        title,
        pageNumber: pageNumber?.toString(),
        text: content,
      });

      // when:
      const response = await request(app)
        .post('/api/recipes')
        .attach('recipeFile', await loadTestFile('recipe1.jpg'), 'recipe1.jpg')
        .expect(201);

      // then:
      expect(response.body[0]).toMatchObject({
        title,
        content,
        pageNumber,
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
      const [recipeEntity] = await recipeRepository.insertMany(recipeEntityMockList.map(toInsertRecipeEntity));
      recipeId = recipeEntity.id;
    });

    it('should update recipe with valid data', async ({ app, database }) => {
      // given:
      const editRecipeDto = toEditRecipeDto(recipeEntityMockDataFactory.build());

      // when:
      const response = await request(app)
        .patch(`/api/recipes/${recipeId}`)
        .send(editRecipeDto)
        .expect(200);

      // then:
      expect(response.body).toMatchObject(editRecipeDto);
      expect(response.body.id).toBe(recipeId);

      const [updatedRecipe] = await database.select().from(databaseSchema.recipesTable).where(eq(databaseSchema.recipesTable.id, recipeId));
      expect(updatedRecipe).toMatchObject(editRecipeDto);
    });

    it('should return 404 for non-existent recipe', async ({ app }) => {
      // given:
      const editRecipeDto = toEditRecipeDto(recipeEntityMockDataFactory.build());

      // when/then:
      await request(app)
        .patch(`/api/recipes/${faker.string.uuid()}`)
        .send(editRecipeDto)
        .expect(404);
    });

    it('should return 422 for invalid update data', async ({ app }) => {
      // given:
      const invalidEditRecipeDto = { title: null };

      // when/then:
      await request(app)
        .patch(`/api/recipes/${recipeId}`)
        .send(invalidEditRecipeDto)
        .expect(422);
    });
  });

  describe('DELETE /api/recipes/:id', () => {
    let recipeId: string;

    beforeEach(async ({ database }) => {
      const recipeRepository = new RecipeRepository(database);
      const [recipeEntity] = await recipeRepository.insertMany(recipeEntityMockList.map(toInsertRecipeEntity));
      recipeId = recipeEntity.id;
    });

    it('should delete existing recipe', async ({ app, database }) => {
      await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .expect(204);

      const recipeEntities = await database.select().from(databaseSchema.recipesTable);
      expect(recipeEntities).toHaveLength(recipeEntityMockList.length - 1);
    });

    it('should return 404 for non-existent recipe', async ({ app }) => {
      await request(app)
        .delete(`/api/recipes/${faker.string.uuid()}`)
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
      const [recipeEntity] = await recipeRepository.insert(insertRecipeEntityMock);

      // when: delete the recipe
      await request(app)
        .delete(`/api/recipes/${recipeEntity.id}`)
        .expect(204);

      // then: verify recipe is deleted from database
      const recipeEntities = await database.select().from(databaseSchema.recipesTable).where(eq(databaseSchema.recipesTable.id, recipeEntity.id));
      expect(recipeEntities).toHaveLength(0);
    });
  });

  describe('PUT /api/recipes/:id/photo', () => {
    let recipeId: string;

    beforeEach(async ({ database }) => {
      const recipeRepository = new RecipeRepository(database);
      const [recipeEntity] = await recipeRepository.insert(insertRecipeEntityMock);
      recipeId = recipeEntity.id;
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

      const [updatedRecipeEntity] = await database.select().from(databaseSchema.recipesTable).where(eq(databaseSchema.recipesTable.id, recipeId));
      expect(updatedRecipeEntity.photoFileId).not.toBeNull();
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

      const [updatedRecipeEntity] = await database.select().from(databaseSchema.recipesTable).where(eq(databaseSchema.recipesTable.id, recipeId));
      expect(updatedRecipeEntity.photoFileId).not.toBe(existingPhotoFileId);
      expect(updatedRecipeEntity.photoFileId).not.toBe(null);
    });

    it('should return 404 for non-existent recipe', async ({ app }) => {
      await request(app)
        .put(`/api/recipes/${faker.string.uuid()}/photo`)
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