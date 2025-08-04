import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import { omit } from 'lodash-es';
import { describe, expect, vi } from 'vitest';
import { databaseSchema } from '../../../bootstrap/databaseSchema';
import { loadTestFile } from '../../../tests/data/testFile';
import { beforeEach, it } from '../../../tests/integration.test';
import { documentAnalysisClientBeginAnalyzeDocument, DocumentAnalysisClientMock, setupAzureFormRecognizerMock } from '../../../tests/mocks/azureAiFormRecognizer.mock';
import { googleBooksMock, googleBookVolumesListMockFn, setupGoogleBooksMock } from '../../../tests/mocks/googleBooks.mock';
import { BookSearchResult } from '../server/external/BookSearchClient';
import { CookbookRepository } from '../server/persistence/cookbookRepository';
import { addCookbookDtoMock, addCookbookWithoutIsbnDtoMock, cookbookEntityMock, cookbookEntityMockDataFactory, cookbookEntityMockList, insertCookbookEntityMock, toEditCookbookDto, toInsertCookbookEntity } from './data/cookbookMockData';

vi.mock('@googleapis/books', () => ({
  books: vi.fn(() => googleBooksMock),
}));

vi.mock('@azure/ai-form-recognizer', () => ({
  DocumentAnalysisClient: vi.fn().mockImplementation(() => DocumentAnalysisClientMock),
  AzureKeyCredential: vi.fn(),
}));

describe('Cookbooks API Integration Tests', () => {
  describe('GET /api/cookbooks', () => {
    it('should return empty array when no cookbooks exist', async ({ app }) => {
      // when:
      const response = await app.request(new Request('http://localhost/api/cookbooks', {
        method: 'GET',
      }));

      // then:
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual([]);
    });

    it('should return all cookbooks when they exist', async ({ app, database }) => {
      // given:
      const cookbookRepository = new CookbookRepository(database);
      const cookbookEntities = cookbookEntityMockList.map(toInsertCookbookEntity);

      await cookbookRepository.insertMany(cookbookEntities);

      // when:
      const response = await app.request(new Request('http://localhost/api/cookbooks', {
        method: 'GET',
      }));

      // then:
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveLength(cookbookEntities.length);
      for (const [index, cookbook] of cookbookEntities.entries()) {
        expect(body[index]).toMatchObject(cookbook);
        expect(body[index].id).toBeDefined();
      }
    });
  });

  describe('POST /api/cookbooks', () => {
    it('should create a new cookbook with valid data', async ({ app, database }) => {
      // given:
      const addCookbookDto = addCookbookDtoMock;

      // when:
      const response = await app.request(new Request('http://localhost/api/cookbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addCookbookDto),
      }));

      // then:
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toMatchObject(addCookbookDto);
      expect(body.id).toBeDefined();

      const cookbooks = await database.select().from(databaseSchema.cookbooksTable);
      expect(cookbooks).toHaveLength(1);
      expect(cookbooks[0]).toMatchObject(addCookbookDto);
    });

    it('should create cookbook without optional ISBN fields', async ({ app }) => {
      // given:
      const addCookbookDto = addCookbookWithoutIsbnDtoMock;

      // when:
      const response = await app.request(new Request('http://localhost/api/cookbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addCookbookDto),
      }));

      // then:
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toMatchObject(addCookbookDto);
      expect(body.isbn10).toBeNull();
      expect(body.isbn13).toBeNull();
    });

    it('should return 422 for invalid data', async ({ app }) => {
      // given:
      const invalidAddCookbookDto = {
        ...addCookbookDtoMock,
        title: null,
      };

      // when:
      const response = await app.request(new Request('http://localhost/api/cookbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidAddCookbookDto),
      }));

      // then:
      expect(response.status).toBe(422);
    });

    it('should return 422 when required fields are missing', async ({ app }) => {
      // given:
      const incompleteAddCookbookDto = omit(addCookbookDtoMock, 'authors');

      // when:
      const response = await app.request(new Request('http://localhost/api/cookbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteAddCookbookDto),
      }));

      // then:
      expect(response.status).toBe(422);
    });
  });

  describe('PATCH /api/cookbooks/:cookbookId', () => {
    let cookbookId: string;

    beforeEach(async ({ database }) => {
      const cookbookRepository = new CookbookRepository(database);
      const cookbookEntity = await cookbookRepository.insert(insertCookbookEntityMock);
      cookbookId = cookbookEntity.id;
    });

    it('should update cookbook with valid data', async ({ app, database }) => {
      // given:
      const editCookbookDto = toEditCookbookDto(cookbookEntityMockDataFactory.build());

      // when:
      const response = await app.request(new Request(`http://localhost/api/cookbooks/${cookbookId}`, {
        method: 'POST', // Note: Hono uses POST for PATCH in this API
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCookbookDto),
      }));

      // then:
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject(editCookbookDto);
      expect(body.id).toBe(cookbookId);

      const [updatedCookbookEntity] = await database.select().from(databaseSchema.cookbooksTable).where(eq(databaseSchema.cookbooksTable.id, cookbookId));
      expect(updatedCookbookEntity).toMatchObject(editCookbookDto);
    });

    it('should return 404 for non-existent cookbook', async ({ app }) => {
      // given:
      const editCookbookDto = toEditCookbookDto(cookbookEntityMockDataFactory.build());
      const nonExistentId = faker.string.uuid();

      // when:
      const response = await app.request(new Request(`http://localhost/api/cookbooks/${nonExistentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCookbookDto),
      }));

      // then:
      expect(response.status).toBe(404);
    });

    it('should return 422 for invalid update data', async ({ app }) => {
      // given:
      const invalidEditCookbookDto = { title: null };

      // when:
      const response = await app.request(new Request(`http://localhost/api/cookbooks/${cookbookId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidEditCookbookDto),
      }));

      // then:
      expect(response.status).toBe(422);
    });
  });

  describe('DELETE /api/cookbooks/:cookbookId', () => {
    let cookbookId: string;

    beforeEach(async ({ database }) => {
      const cookbookRepository = new CookbookRepository(database);
      const [cookbookEntity] = await cookbookRepository.insertMany(cookbookEntityMockList);
      cookbookId = cookbookEntity.id;
    });

    it('should delete existing cookbook', async ({ app, database }) => {
      // when:
      const response = await app.request(new Request(`http://localhost/api/cookbooks/${cookbookId}`, {
        method: 'DELETE',
      }));

      // then:
      expect(response.status).toBe(204);

      const cookbookEntities = await database.select().from(databaseSchema.cookbooksTable);
      expect(cookbookEntities).toHaveLength(cookbookEntityMockList.length - 1);
    });

    it('should return 404 for non-existent cookbook', async ({ app }) => {
      // given:
      const nonExistentId = faker.string.uuid();

      // when:
      const response = await app.request(new Request(`http://localhost/api/cookbooks/${nonExistentId}`, {
        method: 'DELETE',
      }));

      // then:
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/cookbooks/identification', () => {
    it('should identify cookbook from back cover image and return dummy data', async ({ app }) => {
      // given:
      const expectedBookSearchResult: BookSearchResult = {
        title: cookbookEntityMock.title,
        authors: cookbookEntityMock.authors,
        isbn10: cookbookEntityMock.isbn10?.toString() ?? null,
        isbn13: cookbookEntityMock.isbn13?.toString() ?? null,
      };

      const expectedEan13 = faker.commerce.isbn({ variant: 13, separator: '' });

      setupAzureFormRecognizerMock({
        ean13: expectedEan13,
      });
      setupGoogleBooksMock(expectedBookSearchResult);

      const testFile = await loadTestFile('backcover1.jpg');

      // when:
      const formData = new FormData();
      formData.append('backCoverFile', new File([testFile], 'backcover1.jpg', { type: 'image/jpeg' }));

      const response = await app.request(new Request('http://localhost/api/cookbooks/identification', {
        method: 'POST',
        body: formData,
      }));

      // then:
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual(expectedBookSearchResult);

      expect(documentAnalysisClientBeginAnalyzeDocument).toHaveBeenCalledWith(
        'prebuilt-layout',
        expect.any(ArrayBuffer),
        { features: ['barcodes'] },
      );
      expect(googleBookVolumesListMockFn).toHaveBeenCalledWith({
        q: `isbn:${expectedEan13}`,
      });
    });

    it('should return 422 when the image contains no EAN-13 barcode ', async ({ app }) => {
      // given:
      setupAzureFormRecognizerMock({
        ean13: null,
      });

      const testFile = await loadTestFile('backcover1.jpg');

      // when:
      const formData = new FormData();
      formData.append('backCoverFile', new File([testFile], 'backcover1.jpg', { type: 'image/jpeg' }));

      const response = await app.request(new Request('http://localhost/api/cookbooks/identification', {
        method: 'POST',
        body: formData,
      }));

      // then:
      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body).toEqual({
        error: 'No EAN-13 barcode found in uploaded image.',
      });

      expect(documentAnalysisClientBeginAnalyzeDocument).toHaveBeenCalledWith(
        'prebuilt-layout',
        expect.any(ArrayBuffer),
        { features: ['barcodes'] },
      );
      // Google Books should not be called when no barcode is found
      expect(googleBookVolumesListMockFn).not.toHaveBeenCalled();
    });

    it('should return 404 when no book can be found for the extracted EAN-13 barcode ', async ({ app }) => {
      // given:
      const expectedEan13 = faker.commerce.isbn({ variant: 13, separator: '' });

      setupAzureFormRecognizerMock({
        ean13: expectedEan13,
      });
      setupGoogleBooksMock(null);

      const testFile = await loadTestFile('backcover1.jpg');

      // when:
      const formData = new FormData();
      formData.append('backCoverFile', new File([testFile], 'backcover1.jpg', { type: 'image/jpeg' }));

      const response = await app.request(new Request('http://localhost/api/cookbooks/identification', {
        method: 'POST',
        body: formData,
      }));

      // then:
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        error: `No book found for the extracted EAN-13 barcode ${expectedEan13}.`,
      });

      expect(documentAnalysisClientBeginAnalyzeDocument).toHaveBeenCalledWith(
        'prebuilt-layout',
        expect.any(ArrayBuffer),
        { features: ['barcodes'] },
      );
      expect(googleBookVolumesListMockFn).toHaveBeenCalledWith({
        q: `isbn:${expectedEan13}`,
      });
    });

    it('should return 422 when no file is provided', async ({ app }) => {
      // when:
      const response = await app.request(new Request('http://localhost/api/cookbooks/identification', {
        method: 'POST',
        body: new FormData(),
      }));

      // then:
      expect(response.status).toBe(422);
    });

    it('should return 422 when file is not an image', async ({ app }) => {
      // given:
      const invalidFileBuffer = Buffer.from('This is not an image');

      // when:
      const formData = new FormData();
      formData.append('backCoverFile', new File([invalidFileBuffer], 'test-file.txt', { type: 'text/plain' }));

      const response = await app.request(new Request('http://localhost/api/cookbooks/identification', {
        method: 'POST',
        body: formData,
      }));

      // then:
      expect(response.status).toBe(422);
    });
  });
});
