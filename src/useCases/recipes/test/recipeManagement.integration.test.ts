import { faker } from '@faker-js/faker';
import { omit } from 'lodash-es';
import type { AzureOpenAI } from 'openai';
import { describe, expect } from 'vitest';
import { loadTestFile } from '../../../tests/data/testFile';
import { beforeEach, it } from '../../../tests/integrationTest';
import { loggerMock } from '../../../tests/mocks/logger.mock';
import { AzureOpenAIRecipeExtractionService } from '../infrastructure/AzureOpenAIRecipeExtractionService';
import { recipeExtractionService } from '../infrastructure/di';
import { CookbookDatabaseRepository } from '../infrastructure/persistence/CookbookDatabaseRepository';
import { RecipeDatabaseRepository } from '../infrastructure/persistence/RecipeDatabaseRepository';
import { newCookbookMock } from './data/cookbookMockData';
import { ingredientEntityMockDataFactory, ingredientEntityMockList, toIngredient } from './data/ingredientMockData';
import { addRecipeDtoMock, insertRecipeEntityMock, newRecipeMock, recipeEntityMock, recipeEntityMockDataFactory, recipeEntityMockList, toEditRecipeDto, toNewRecipe } from './data/recipeMockData';
import { azureOpenAIMock, setupAzureOpenAIMock } from './mocks/azureOpenAI.mock';

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
      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const insertRecipeEntity = insertRecipeEntityMock;

      await recipeRepository.insert(newRecipeMock);

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
      const cookbookRepository = new CookbookDatabaseRepository(database, loggerMock);
      const cookbookEntity = await cookbookRepository.insert(newCookbookMock);

      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const recipeWithCookbook = {
        ...newRecipeMock,
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
      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const recipeWithoutCookbook = {
        ...newRecipeMock,
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
      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const recipeEntity = await recipeRepository.insert(newRecipeMock);
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
      expect(body).toMatchObject({
        ...recipeEntityMock,
        id: recipeId,
      });
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
    beforeEach(({ env }) => {
      recipeExtractionService.injection(new AzureOpenAIRecipeExtractionService(azureOpenAIMock as unknown as AzureOpenAI, env.azureOpenAI.model, env.recipeExtraction, loggerMock));
    });

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

      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const recipes = await recipeRepository.getAll();
      expect(recipes).toHaveLength(1);
      expect(recipes[0]).toMatchObject({
        ...recipeEntityMock,
        id: body.id,
        photoFileId: null,
        recipeFileId: null,
      });
    });

    it('stores explicit missing instructions and rejects blank instructions', async ({ app }) => {
      const create = await app.request(new Request('http://localhost/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addRecipeDtoMock, instructions: null }),
      }));
      expect(create.status).toBe(201);
      const recipe = await create.json();
      expect(recipe.instructions).toBeNull();

      const update = (instructions: string | null) => app.request(new Request(`http://localhost/api/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions }),
      }));
      expect((await update('Cook dinner.')).status).toBe(200);
      const cleared = await update(null);
      expect(cleared.status).toBe(200);
      expect((await cleared.json()).instructions).toBeNull();
      expect((await update('   ')).status).toBe(422);
      const fetched = await app.request(new Request(`http://localhost/api/recipes/${recipe.id}`));
      expect((await fetched.json()).instructions).toBeNull();
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
      const cookbookRepository = new CookbookDatabaseRepository(database, loggerMock);
      const cookbookEntity = await cookbookRepository.insert(newCookbookMock);
      const cookbookId = cookbookEntity.id;

      const { title, pageNumber, instructions } = recipeEntityMock;
      const ingredients = ingredientEntityMockList.map(toIngredient);

      // Setup the Azure OpenAI mock
      setupAzureOpenAIMock({
        title,
        pageNumber,
        instructions,
        ingredients,
      });

      const initialFileCount = fileSystemMock.getFileCount();
      const testFile = await loadTestFile('recipe1.jpg');

      // when:
      const formData = new FormData();
      formData.append('recipeFile', testFile);
      formData.append('cookbookId', cookbookId);

      const response = await app.request(new Request('http://localhost/api/recipes/from-recipe', {
        method: 'POST',
        body: formData,
      }));

      // then:
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toMatchObject({
        title,
        pageNumber,
        instructions,
        ingredients,
        cookbookId,
        photoFileId: null,
      });
      expect(body.id).toBeDefined();
      expect(body.recipeFileId).toBeDefined();

      expect(fileSystemMock.getFileCount()).toBe(initialFileCount + 1);
      expect(fileSystemMock.fileExists(`/data/recipes/${body.recipeFileId}`)).toBe(true);

      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const recipes = await recipeRepository.getAll();
      expect(recipes).toHaveLength(1);
      expect(recipes[0].recipeFileId).not.toBeNull();
    });

    it('should require a cookbook for a written recipe', async ({ app, database }) => {
      // given:
      // Setup the Azure OpenAI mock
      const { title, pageNumber, instructions } = recipeEntityMock;
      const ingredients = ingredientEntityMockList.map(toIngredient);

      // Setup the Azure OpenAI mock
      setupAzureOpenAIMock({
        title,
        pageNumber,
        instructions,
        ingredients,
      });

      const testFile = await loadTestFile('recipe1.jpg');

      // when:
      const formData = new FormData();
      formData.append('recipeFile', testFile);

      const response = await app.request(new Request('http://localhost/api/recipes/from-recipe', {
        method: 'POST',
        body: formData,
      }));

      // then:
      expect(response.status).toBe(422);

      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const recipes = await recipeRepository.getAll();
      expect(recipes).toHaveLength(0);
    });
  });

  describe('photo creation and completion', () => {
    beforeEach(({ env }) => {
      recipeExtractionService.injection(new AzureOpenAIRecipeExtractionService(azureOpenAIMock as unknown as AzureOpenAI, env.azureOpenAI.model, env.recipeExtraction, loggerMock));
    });

    it('stores an incomplete recipe and its photo variants, then completes it while preserving the photo', async ({ app, database, fileSystemMock }) => {
      const photoFile = await loadTestFile('recipe2.jpg');
      const photoForm = new FormData();
      photoForm.append('title', '  My dinner  ');
      photoForm.append('photoFile', photoFile);
      const createdResponse = await app.request(new Request('http://localhost/api/recipes/from-photo', { method: 'POST', body: photoForm }));
      expect(createdResponse.status).toBe(201);
      const created = await createdResponse.json();
      expect(created).toMatchObject({ title: 'My dinner', cookbookId: null, recipeFileId: null, pageNumber: null, instructions: null, ingredients: [] });
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${created.photoFileId}`)).toBe(true);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${created.photoFileId}.preview.webp`)).toBe(true);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${created.photoFileId}.display.webp`)).toBe(true);

      const cookbook = await new CookbookDatabaseRepository(database, loggerMock).insert(newCookbookMock);
      setupAzureOpenAIMock({ title: 'Extracted dinner', instructions: 'Cook it.', pageNumber: 3 });
      const completionForm = new FormData();
      completionForm.append('cookbookId', cookbook.id);
      completionForm.append('recipeFile', await loadTestFile('recipe1.jpg'));
      const completedResponse = await app.request(new Request(`http://localhost/api/recipes/${created.id}/from-recipe`, { method: 'POST', body: completionForm }));
      expect(completedResponse.status).toBe(200);
      const completed = await completedResponse.json();
      expect(completed).toMatchObject({ title: 'Extracted dinner', cookbookId: cookbook.id, photoFileId: created.photoFileId, instructions: 'Cook it.', pageNumber: 3 });
      expect(completed.recipeFileId).not.toBeNull();
      expect(fileSystemMock.fileExists(`/data/recipes/${completed.recipeFileId}`)).toBe(true);

      setupAzureOpenAIMock({ title: null, instructions: '   ' });
      const replacementForm = new FormData();
      replacementForm.append('cookbookId', cookbook.id);
      replacementForm.append('recipeFile', await loadTestFile('recipe2.jpg'));
      const replacementResponse = await app.request(new Request(`http://localhost/api/recipes/${created.id}/from-recipe`, { method: 'POST', body: replacementForm }));
      expect(replacementResponse.status).toBe(200);
      const replaced = await replacementResponse.json();
      expect(replaced.title).toBe('Extracted dinner');
      expect(replaced.instructions).toBeNull();
      expect(replaced.photoFileId).toBe(created.photoFileId);
      expect(fileSystemMock.fileExists(`/data/recipes/${completed.recipeFileId}`)).toBe(false);
      expect(fileSystemMock.fileExists(`/data/recipes/${replaced.recipeFileId}`)).toBe(true);
    });

    it('rejects invalid photo input and completion of a missing recipe', async ({ app, database }) => {
      const missingPhoto = new FormData();
      missingPhoto.append('title', 'Dinner');
      expect((await app.request(new Request('http://localhost/api/recipes/from-photo', { method: 'POST', body: missingPhoto }))).status).toBe(422);

      const emptyTitle = new FormData();
      emptyTitle.append('title', '   ');
      emptyTitle.append('photoFile', await loadTestFile('recipe1.jpg'));
      expect((await app.request(new Request('http://localhost/api/recipes/from-photo', { method: 'POST', body: emptyTitle }))).status).toBe(422);

      const invalidFile = new FormData();
      invalidFile.append('title', 'Dinner');
      invalidFile.append('photoFile', new File(['text'], 'note.txt', { type: 'text/plain' }));
      expect((await app.request(new Request('http://localhost/api/recipes/from-photo', { method: 'POST', body: invalidFile }))).status).toBe(422);

      const cookbook = await new CookbookDatabaseRepository(database, loggerMock).insert(newCookbookMock);
      const invalidCookbook = new FormData();
      invalidCookbook.append('cookbookId', 'invalid');
      invalidCookbook.append('recipeFile', await loadTestFile('recipe1.jpg'));
      expect((await app.request(new Request('http://localhost/api/recipes/from-recipe', { method: 'POST', body: invalidCookbook }))).status).toBe(422);

      const invalidRecipeFile = new FormData();
      invalidRecipeFile.append('cookbookId', cookbook.id);
      invalidRecipeFile.append('recipeFile', new File(['text'], 'note.txt', { type: 'text/plain' }));
      expect((await app.request(new Request('http://localhost/api/recipes/from-recipe', { method: 'POST', body: invalidRecipeFile }))).status).toBe(422);

      const missingRecipe = new FormData();
      missingRecipe.append('cookbookId', cookbook.id);
      missingRecipe.append('recipeFile', await loadTestFile('recipe1.jpg'));
      expect((await app.request(new Request(`http://localhost/api/recipes/${faker.string.uuid()}/from-recipe`, { method: 'POST', body: missingRecipe }))).status).toBe(404);
      expect((await app.request(new Request('http://localhost/api/recipes/invalid/from-recipe', { method: 'POST', body: missingRecipe }))).status).toBe(422);

      const missingFile = new FormData();
      missingFile.append('cookbookId', cookbook.id);
      expect((await app.request(new Request(`http://localhost/api/recipes/${faker.string.uuid()}/from-recipe`, { method: 'POST', body: missingFile }))).status).toBe(422);
    });
  });

  describe('PATCH /api/recipes/:recipeId', () => {
    let recipeId: string;

    beforeEach(async ({ database }) => {
      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const [recipeEntity] = await recipeRepository.insertMany(
        recipeEntityMockList.map(recipeEntity => toNewRecipe(recipeEntity, ingredientEntityMockDataFactory.buildList(5))),
      );
      recipeId = recipeEntity.id;
    });

    it('should update recipe with valid data', async ({ app, database }) => {
      // given:
      const ingredientEntities = ingredientEntityMockDataFactory.buildList(3);
      const editRecipeDto = toEditRecipeDto(recipeEntityMockDataFactory.build(), ingredientEntities);

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

      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const updatedRecipe = await recipeRepository.findById(recipeId);
      expect(updatedRecipe).toMatchObject(editRecipeDto);
    });

    it('should return 404 for non-existent recipe', async ({ app }) => {
      // given:
      const editRecipeDto = toEditRecipeDto(recipeEntityMockDataFactory.build(), []);
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
      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const [recipeEntity] = await recipeRepository.insertMany(
        recipeEntityMockList.map(recipeEntity => toNewRecipe(recipeEntity, ingredientEntityMockDataFactory.buildList(5))),
      );
      recipeId = recipeEntity.id;
    });

    it('should delete existing recipe', async ({ app, database }) => {
      // when:
      const response = await app.request(new Request(`http://localhost/api/recipes/${recipeId}`, {
        method: 'DELETE',
      }));

      // then:
      expect(response.status).toBe(204);

      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
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
      const { title, pageNumber, instructions } = recipeEntityMock;
      const ingredients = ingredientEntityMockList.map(toIngredient);

      // Setup the Azure OpenAI mock
      setupAzureOpenAIMock({
        title,
        pageNumber,
        instructions,
        ingredients,
      });

      const testFile1 = await loadTestFile('recipe1.jpg');
      const cookbookRepository = new CookbookDatabaseRepository(database, loggerMock);
      const cookbook = await cookbookRepository.insert(newCookbookMock);
      const formData1 = new FormData();
      formData1.append('recipeFile', testFile1);
      formData1.append('cookbookId', cookbook.id);

      const createResponse = await app.request(new Request('http://localhost/api/recipes/from-recipe', {
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
      formData2.append('photoFile', testFile2);

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
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${photoFileId}.preview.webp`)).toBe(true);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${photoFileId}.display.webp`)).toBe(true);

      // when: delete the recipe
      const deleteResponse = await app.request(new Request(`http://localhost/api/recipes/${createdRecipeId}`, {
        method: 'DELETE',
      }));

      // then: verify recipe is deleted from database
      expect(deleteResponse.status).toBe(204);

      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const recipes = await recipeRepository.findById(createdRecipeId);
      expect(recipes).toBeNull();

      // and: verify files are also deleted
      expect(fileSystemMock.fileExists(`/data/recipes/${recipeFileId}`)).toBe(false);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${photoFileId}`)).toBe(false);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${photoFileId}.preview.webp`)).toBe(false);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${photoFileId}.display.webp`)).toBe(false);
    });

    it('should delete recipe without files gracefully', async ({ app, database }) => {
      // given: create a recipe without any files (manually inserted)
      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const recipeEntity = await recipeRepository.insert(newRecipeMock);

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
      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const recipeEntity = await recipeRepository.insert(newRecipeMock);
      recipeId = recipeEntity.id;
    });

    it('should add photo to existing recipe', async ({ app, database, fileSystemMock }) => {
      // given:
      const initialFileCount = fileSystemMock.getFileCount();
      const testFile = await loadTestFile('recipe1.jpg');
      const originalPhoto = new Uint8Array(await testFile.arrayBuffer());

      // when:
      const formData = new FormData();
      formData.append('photoFile', testFile);

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
      expect(fileSystemMock.getFileCount()).toBe(initialFileCount + 3);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${body.photoFileId}`)).toBe(true);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${body.photoFileId}.preview.webp`)).toBe(true);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${body.photoFileId}.display.webp`)).toBe(true);
      const storedOriginal = new Uint8Array(await new Response(await fileSystemMock.readFile(`/data/recipePhotos/${body.photoFileId}`)).arrayBuffer());
      expect(storedOriginal).toEqual(originalPhoto);

      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const updatedRecipeEntity = await recipeRepository.findById(recipeId);
      expect(updatedRecipeEntity?.photoFileId).not.toBeNull();
    }, 15_000);

    it('should replace existing photo and remove all variants of the previous photo', async ({ app, database, fileSystemMock }) => {
      // given: recipe with existing photo - first upload a photo
      const testFile1 = await loadTestFile('recipe1.jpg');

      const formData1 = new FormData();
      formData1.append('photoFile', testFile1);

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
      formData2.append('photoFile', testFile2);

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

      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const updatedRecipeEntity = await recipeRepository.findById(recipeId);
      expect(updatedRecipeEntity?.photoFileId).not.toBe(existingPhotoFileId);
      expect(updatedRecipeEntity?.photoFileId).not.toBe(null);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${existingPhotoFileId}`)).toBe(false);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${existingPhotoFileId}.preview.webp`)).toBe(false);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${existingPhotoFileId}.display.webp`)).toBe(false);
    });

    it('should return 404 for non-existent recipe', async ({ app }) => {
      // given:
      const nonExistentId = faker.string.uuid();
      const testFile = await loadTestFile('recipe1.jpg');

      // when:
      const formData = new FormData();
      formData.append('photoFile', testFile);

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
      formData.append('photoFile', new File([new TextEncoder().encode('not an image')], 'test.txt', { type: 'text/plain' }));

      const response = await app.request(new Request(`http://localhost/api/recipes/${recipeId}/photo`, {
        method: 'PUT',
        body: formData,
      }));

      // then:
      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/recipes/:recipeId/photo', () => {
    let recipeId: string;

    beforeEach(async ({ database, app }) => {
      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const recipeEntity = await recipeRepository.insert(newRecipeMock);
      recipeId = recipeEntity.id;

      // Add a photo to the recipe
      const testFile = await loadTestFile('recipe1.jpg');
      const formData = new FormData();
      formData.append('photoFile', new File([testFile], 'recipe1.jpg', { type: 'image/jpeg' }));

      // Use the API to upload the photo so we have a real photo stored
      const uploadResponse = await app.request(new Request(`http://localhost/api/recipes/${recipeId}/photo`, {
        method: 'PUT',
        body: formData,
      }));

      expect(uploadResponse.status).toBe(200);
    });

    it('should return the prepared-food photo when it exists', async ({ app }) => {
      // when:
      const response = await app.request(new Request(`http://localhost/api/recipes/${recipeId}/photo`, {
        method: 'GET',
      }));

      // then:
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/webp');
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');

      // Verify we get back image data
      const photoData = await response.arrayBuffer();
      expect(photoData.byteLength).toBeGreaterThan(0);
    });

    it('should return a low-quality preview', async ({ app }) => {
      // when:
      const response = await app.request(new Request(`http://localhost/api/recipes/${recipeId}/photo?variant=preview`, {
        method: 'GET',
      }));

      // then:
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/webp');
      const photoData = await response.arrayBuffer();
      expect(photoData.byteLength).toBeGreaterThan(0);
    });

    it('should generate missing variants for an existing original without changing it', async ({ app, database, fileSystemMock }) => {
      // given:
      const legacyPhotoId = faker.string.uuid();
      const legacyPhoto = await loadTestFile('recipe1.jpg');
      const originalPhoto = new Uint8Array(await legacyPhoto.arrayBuffer());
      await fileSystemMock.mkdir('/data/recipePhotos', { recursive: true });
      await fileSystemMock.writeFile(`/data/recipePhotos/${legacyPhotoId}`, legacyPhoto.stream());

      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const legacyRecipe = await recipeRepository.insert({
        ...newRecipeMock,
        photoFileId: legacyPhotoId,
      });

      // when:
      const response = await app.request(new Request(`http://localhost/api/recipes/${legacyRecipe.id}/photo?variant=preview`, {
        method: 'GET',
      }));

      // then:
      expect(response.status).toBe(200);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${legacyPhotoId}.preview.webp`)).toBe(true);
      expect(fileSystemMock.fileExists(`/data/recipePhotos/${legacyPhotoId}.display.webp`)).toBe(true);
      const storedOriginal = new Uint8Array(await new Response(await fileSystemMock.readFile(`/data/recipePhotos/${legacyPhotoId}`)).arrayBuffer());
      expect(storedOriginal).toEqual(originalPhoto);
    }, 15_000);

    it('should return 404 for non-existent recipe', async ({ app }) => {
      // given:
      const nonExistentId = faker.string.uuid();

      // when:
      const response = await app.request(new Request(`http://localhost/api/recipes/${nonExistentId}/photo`, {
        method: 'GET',
      }));

      // then:
      expect(response.status).toBe(404);
    });

    it('should return 404 when recipe has no photo', async ({ app, database }) => {
      // given: create a recipe without a photo
      const recipeRepository = new RecipeDatabaseRepository(database, loggerMock);
      const recipeEntityWithoutPhoto = await recipeRepository.insert({
        ...newRecipeMock,
        photoFileId: null,
      });

      // when:
      const response = await app.request(new Request(`http://localhost/api/recipes/${recipeEntityWithoutPhoto.id}/photo`, {
        method: 'GET',
      }));

      // then:
      expect(response.status).toBe(404);
    });
  });
});
