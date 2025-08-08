import { faker } from '@faker-js/faker';
import { omit } from 'lodash-es';
import { describe, expect, vi } from 'vitest';
import { loadTestFile } from '../../../tests/data/testFile';
import { beforeEach, it } from '../../../tests/integration.test';
import { DocumentAnalysisClientMock, setupAzureFormRecognizerMock } from '../../../tests/mocks/azureAiFormRecognizer.mock';
import { CookbookRepository } from '../../cookbookManagement/server/persistence/cookbookRepository';
import { insertCookbookEntityMock } from '../../cookbookManagement/test/data/cookbookMockData';
import { RecipeRepository } from '../server/persistence/recipeRepository';
import { addRecipeDtoMock, insertRecipeEntityMock, recipeEntityMock, recipeEntityMockDataFactory, recipeEntityMockList, toEditRecipeDto, toInsertRecipeEntity } from './data/recipeMockData';

vi.mock('@azure/ai-form-recognizer', () => ({
  DocumentAnalysisClient: vi.fn().mockImplementation(() => DocumentAnalysisClientMock),
  AzureKeyCredential: vi.fn(),
}));

describe('Recipe Management API Integration Tests', () => {
  describe('GET /api/recipes', () => {
    it('should return empty array when no recipes exist', async ({ app }) => {
      // when:
      const response = await app.request(new Request('http://localhost/api/recipes', {
        method: 'GET',
      }));

      // then:
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual([]);
    });

    it('should return all recipes when they exist', async ({ app, database }) => {
      // given:
      const recipeRepository = new RecipeRepository(database);
      const insertRecipeEntity = insertRecipeEntityMock;

      await recipeRepository.insert(insertRecipeEntity);

      // when:
      const response = await app.request(new Request('http://localhost/api/recipes', {
        method: 'GET',
      }));

      // then:
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject(insertRecipeEntity);
      expect(body[0].id).toBeDefined();
    });

    it('should return recipe with cookbook data when recipe has cookbook', async ({ app, database }) => {
      // given:
      const cookbookRepository = new CookbookRepository(database);
      const cookbookEntity = await cookbookRepository.insert(insertCookbookEntityMock);

      const recipeRepository = new RecipeRepository(database);
      const recipeWithCookbook = {
        ...insertRecipeEntityMock,
        cookbookId: cookbookEntity.id,
      };
      await recipeRepository.insert(recipeWithCookbook);

      // when:
      const response = await app.request(new Request('http://localhost/api/recipes', {
        method: 'GET',
      }));

      // then:
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject(recipeWithCookbook);
      expect(body[0].cookbook).toBeDefined();
      expect(body[0].cookbook.title).toBe(cookbookEntity.title);
      expect(body[0].cookbook.id).toBe(cookbookEntity.id);
    });

    it('should return recipe with null cookbook when recipe has no cookbook', async ({ app, database }) => {
      // given:
      const recipeRepository = new RecipeRepository(database);
      const recipeWithoutCookbook = {
        ...insertRecipeEntityMock,
        cookbookId: null,
      };
      await recipeRepository.insert(recipeWithoutCookbook);

      // when:
      const response = await app.request(new Request('http://localhost/api/recipes', {
        method: 'GET',
      }));

      // then:
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject(recipeWithoutCookbook);
      expect(body[0].cookbook).toBeNull();
    });
  });

  describe('GET /api/recipes/:recipeId', () => {
    let recipeId: string;

    beforeEach(async ({ database }) => {
      const recipeRepository = new RecipeRepository(database);
      const recipeEntity = await recipeRepository.insert(insertRecipeEntityMock);
      recipeId = recipeEntity.id;
    });

    it('should return specific recipe when it exists', async ({ app }) => {
      // when:
      const response = await app.request(new Request(`http://localhost/api/recipes/${recipeId}`, {
        method: 'GET',
      }));

      // then:
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.id).toBe(recipeId);
      expect(body.title).toBeDefined();
      expect(body.content).toBeDefined();
    });

    it('should return 404 for non-existent recipe', async ({ app }) => {
      // given:
      const nonExistentId = faker.string.uuid();

      // when:
      const response = await app.request(new Request(`http://localhost/api/recipes/${nonExistentId}`, {
        method: 'GET',
      }));

      // then:
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/recipes', () => {
    it('should create a new recipe with valid data', async ({ app, database }) => {
      // given:
      const addRecipeDto = addRecipeDtoMock;

      // when:
      const response = await app.request(new Request('http://localhost/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addRecipeDto),
      }));

      // then:
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toMatchObject(addRecipeDto);
      expect(body.id).toBeDefined();

      const recipeRepository = new RecipeRepository(database);
      const recipes = await recipeRepository.getAll();
      expect(recipes).toHaveLength(1);
      expect(recipes[0]).toMatchObject(addRecipeDto);
    });

    it('should return 422 for invalid data', async ({ app }) => {
      // given:
      const invalidAddRecipeDto = {
        ...addRecipeDtoMock,
        title: null,
      };

      // when:
      const response = await app.request(new Request('http://localhost/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidAddRecipeDto),
      }));

      // then:
      expect(response.status).toBe(422);
    });

    it('should return 422 when required fields are missing', async ({ app }) => {
      // given:
      const incompleteAddRecipeDto = omit(addRecipeDtoMock, 'title');

      // when:
      const response = await app.request(new Request('http://localhost/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteAddRecipeDto),
      }));

      // then:
      expect(response.status).toBe(422);
    });

    it('should create a recipe from uploaded image file', async ({ app, database, fileSystemMock }) => {
      // given:
      // Create a cookbook first
      const cookbookRepository = new CookbookRepository(database);
      const cookbookEntity = await cookbookRepository.insert(insertCookbookEntityMock);
      const cookbookId = cookbookEntity.id;

      const { title, pageNumber, content } = recipeEntityMock;

      // Setup the document analysis mock
      setupAzureFormRecognizerMock({
        title,
        pageNumber: pageNumber?.toString(),
        text: content,
      });

      const initialFileCount = fileSystemMock.getFileCount();
      const testFile = await loadTestFile('recipe1.jpg');

      // when:
      const formData = new FormData();
      formData.append('recipeFile', new File([testFile], 'recipe1.jpg', { type: 'image/jpeg' }));
      formData.append('cookbookId', cookbookId);

      const response = await app.request(new Request('http://localhost/api/recipes/from-photo', {
        method: 'POST',
        body: formData,
      }));

      // then:
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toMatchObject({
        title,
        content,
        pageNumber,
        cookbookId,
        photoFileId: null,
      });
      expect(body.id).toBeDefined();
      expect(body.recipeFileId).toBeDefined();

      expect(fileSystemMock.getFileCount()).toBe(initialFileCount + 1);
      expect(fileSystemMock.fileExists(`/data/recipes/${body.recipeFileId}`)).toBe(true);

      const recipeRepository = new RecipeRepository(database);
      const recipes = await recipeRepository.getAll();
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

      const testFile = await loadTestFile('recipe1.jpg');

      // when:
      const formData = new FormData();
      formData.append('recipeFile', new File([testFile], 'recipe1.jpg', { type: 'image/jpeg' }));

      const response = await app.request(new Request('http://localhost/api/recipes/from-photo', {
        method: 'POST',
        body: formData,
      }));

      // then:
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toMatchObject({
        title,
        content,
        pageNumber,
        cookbookId: null,
        photoFileId: null,
      });
      expect(body.id).toBeDefined();
      expect(body.recipeFileId).toBeDefined();

      const recipeRepository = new RecipeRepository(database);
      const recipes = await recipeRepository.getAll();
      expect(recipes).toHaveLength(1);
      expect(recipes[0].recipeFileId).not.toBeNull();
    });
  });

  describe('PATCH /api/recipes/:recipeId', () => {
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
      const response = await app.request(new Request(`http://localhost/api/recipes/${recipeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRecipeDto),
      }));

      // then:
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject(editRecipeDto);
      expect(body.id).toBe(recipeId);

      const recipeRepository = new RecipeRepository(database);
      const updatedRecipe = await recipeRepository.findById(recipeId);
      expect(updatedRecipe).toMatchObject(editRecipeDto);
    });

    it('should return 404 for non-existent recipe', async ({ app }) => {
      // given:
      const editRecipeDto = toEditRecipeDto(recipeEntityMockDataFactory.build());
      const nonExistentId = faker.string.uuid();

      // when:
      const response = await app.request(new Request(`http://localhost/api/recipes/${nonExistentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRecipeDto),
      }));

      // then:
      expect(response.status).toBe(404);
    });

    it('should return 422 for invalid update data', async ({ app }) => {
      // given:
      const invalidEditRecipeDto = { title: null };

      // when:
      const response = await app.request(new Request(`http://localhost/api/recipes/${recipeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidEditRecipeDto),
      }));

      // then:
      expect(response.status).toBe(422);
    });
  });

  describe('DELETE /api/recipes/:recipeId', () => {
    let recipeId: string;

    beforeEach(async ({ database }) => {
      const recipeRepository = new RecipeRepository(database);
      const [recipeEntity] = await recipeRepository.insertMany(recipeEntityMockList.map(toInsertRecipeEntity));
      recipeId = recipeEntity.id;
    });

    it('should delete existing recipe', async ({ app, database }) => {
      // when:
      const response = await app.request(new Request(`http://localhost/api/recipes/${recipeId}`, {
        method: 'DELETE',
      }));

      // then:
      expect(response.status).toBe(204);

      const recipeRepository = new RecipeRepository(database);
      const recipeEntities = await recipeRepository.getAll();
      expect(recipeEntities).toHaveLength(recipeEntityMockList.length - 1);
    });

    it('should return 404 for non-existent recipe', async ({ app }) => {
      // given:
      const nonExistentId = faker.string.uuid();

      // when:
      const response = await app.request(new Request(`http://localhost/api/recipes/${nonExistentId}`, {
        method: 'DELETE',
      }));

      // then:
      expect(response.status).toBe(404);
    });

    it('should delete recipe files when recipe is deleted', async ({ app, database, fileSystemMock }) => {
      // given: create a recipe with both photo and recipe files

      // First create a recipe with a recipe file
      setupAzureFormRecognizerMock({
        title: 'Test Recipe',
        pageNumber: '1',
        text: 'Test recipe content.',
      });

      const testFile1 = await loadTestFile('recipe1.jpg');
      const formData1 = new FormData();
      formData1.append('recipeFile', new File([testFile1], 'recipe1.jpg', { type: 'image/jpeg' }));

      const createResponse = await app.request(new Request('http://localhost/api/recipes/from-photo', {
        method: 'POST',
        body: formData1,
      }));

      expect(createResponse.status).toBe(201);
      const createBody = await createResponse.json();
      const createdRecipeId = createBody.id;
      const recipeFileId = createBody.recipeFileId;

      // Add a photo to the recipe
      const testFile2 = await loadTestFile('recipe2.jpg');
      const formData2 = new FormData();
      formData2.append('photoFile', new File([testFile2], 'recipe2.jpg', { type: 'image/jpeg' }));

      const photoResponse = await app.request(new Request(`http://localhost/api/recipes/${createdRecipeId}/photo`, {
        method: 'PUT',
        body: formData2,
      }));

      expect(photoResponse.status).toBe(200);
      const photoBody = await photoResponse.json();
      const photoFileId = photoBody.photoFileId;

      // Verify files exist
      expect(fileSystemMock.fileExists(`/data/recipes/${recipeFileId}`)).toBe(true);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${photoFileId}`)).toBe(true);

      // when: delete the recipe
      const deleteResponse = await app.request(new Request(`http://localhost/api/recipes/${createdRecipeId}`, {
        method: 'DELETE',
      }));

      // then: verify recipe is deleted from database
      expect(deleteResponse.status).toBe(204);

      const recipeRepository = new RecipeRepository(database);
      const recipes = await recipeRepository.findById(createdRecipeId);
      expect(recipes).toBeNull();

      // and: verify files are also deleted
      expect(fileSystemMock.fileExists(`/data/recipes/${recipeFileId}`)).toBe(false);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${photoFileId}`)).toBe(false);
    });

    it('should delete recipe without files gracefully', async ({ app, database }) => {
      // given: create a recipe without any files (manually inserted)
      const recipeRepository = new RecipeRepository(database);
      const recipeEntity = await recipeRepository.insert(insertRecipeEntityMock);

      // when: delete the recipe
      const response = await app.request(new Request(`http://localhost/api/recipes/${recipeEntity.id}`, {
        method: 'DELETE',
      }));

      // then: verify recipe is deleted from database
      expect(response.status).toBe(204);

      const recipeEntities = await recipeRepository.findById(recipeEntity.id);
      expect(recipeEntities).toBeNull();
    });
  });

  describe('PUT /api/recipes/:recipeId/photo', () => {
    let recipeId: string;

    beforeEach(async ({ database }) => {
      const recipeRepository = new RecipeRepository(database);
      const recipeEntity = await recipeRepository.insert(insertRecipeEntityMock);
      recipeId = recipeEntity.id;
    });

    it('should add photo to existing recipe', async ({ app, database, fileSystemMock }) => {
      // given:
      const initialFileCount = fileSystemMock.getFileCount();
      const testFile = await loadTestFile('recipe1.jpg');

      // when:
      const formData = new FormData();
      formData.append('photoFile', new File([testFile], 'recipe1.jpg', { type: 'image/jpeg' }));

      const response = await app.request(new Request(`http://localhost/api/recipes/${recipeId}/photo`, {
        method: 'PUT',
        body: formData,
      }));

      // then:
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.id).toBe(recipeId);
      expect(body.photoFileId).toBeDefined();
      expect(body.photoFileId).not.toBeNull();
      expect(fileSystemMock.getFileCount()).toBe(initialFileCount + 1);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${body.photoFileId}`)).toBe(true);

      const recipeRepository = new RecipeRepository(database);
      const updatedRecipeEntity = await recipeRepository.findById(recipeId);
      expect(updatedRecipeEntity?.photoFileId).not.toBeNull();
    });

    it('should replace existing photo', async ({ app, database }) => {
      // given: recipe with existing photo - first upload a photo
      const testFile1 = await loadTestFile('recipe1.jpg');

      const formData1 = new FormData();
      formData1.append('photoFile', new File([testFile1], 'recipe1.jpg', { type: 'image/jpeg' }));

      const firstUploadResponse = await app.request(new Request(`http://localhost/api/recipes/${recipeId}/photo`, {
        method: 'PUT',
        body: formData1,
      }));

      expect(firstUploadResponse.status).toBe(200);
      const firstBody = await firstUploadResponse.json();
      const existingPhotoFileId = firstBody.photoFileId;

      // when: upload a different photo to replace the existing one
      const testFile2 = await loadTestFile('recipe2.jpg');
      const formData2 = new FormData();
      formData2.append('photoFile', new File([testFile2], 'recipe2.jpg', { type: 'image/jpeg' }));

      const response = await app.request(new Request(`http://localhost/api/recipes/${recipeId}/photo`, {
        method: 'PUT',
        body: formData2,
      }));

      // then:
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.id).toBe(recipeId);
      expect(body.photoFileId).toBeDefined();
      expect(body.photoFileId).not.toBe(existingPhotoFileId);

      const recipeRepository = new RecipeRepository(database);
      const updatedRecipeEntity = await recipeRepository.findById(recipeId);
      expect(updatedRecipeEntity?.photoFileId).not.toBe(existingPhotoFileId);
      expect(updatedRecipeEntity?.photoFileId).not.toBe(null);
    });

    it('should return 404 for non-existent recipe', async ({ app }) => {
      // given:
      const nonExistentId = faker.string.uuid();
      const testFile = await loadTestFile('recipe1.jpg');

      // when:
      const formData = new FormData();
      formData.append('photoFile', new File([testFile], 'recipe1.jpg', { type: 'image/jpeg' }));

      const response = await app.request(new Request(`http://localhost/api/recipes/${nonExistentId}/photo`, {
        method: 'PUT',
        body: formData,
      }));

      // then:
      expect(response.status).toBe(404);
    });

    it('should return 422 when no photo file is provided', async ({ app }) => {
      // when:
      const response = await app.request(new Request(`http://localhost/api/recipes/${recipeId}/photo`, {
        method: 'PUT',
        body: new FormData(),
      }));

      // then:
      expect(response.status).toBe(422);
    });

    it('should return 422 for invalid file type', async ({ app }) => {
      // when:
      const formData = new FormData();
      formData.append('photoFile', new File([Buffer.from('not an image')], 'test.txt', { type: 'text/plain' }));

      const response = await app.request(new Request(`http://localhost/api/recipes/${recipeId}/photo`, {
        method: 'PUT',
        body: formData,
      }));

      // then:
      expect(response.status).toBe(422);
    });
  });
});