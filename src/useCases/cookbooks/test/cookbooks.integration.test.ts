import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import { omit } from 'lodash-es';
import request from 'supertest';
import { describe, expect, vi } from 'vitest';
import { BookSearchResult } from '../../../application/server/BookSearchClient';
import { databaseSchema } from '../../../bootstrap/databaseSchema';
import { loadTestFile } from '../../../tests/data/testFile';
import { beforeEach, it } from '../../../tests/integration.test';
import { documentAnalysisClientBeginAnalyzeDocument, DocumentAnalysisClientMock, setupAzureFormRecognizerMock } from '../../../tests/mocks/azureAiFormRecognizer.mock';
import { googleBooksMock, googleBookVolumesListMockFn, setupGoogleBooksMock } from '../../../tests/mocks/googleBooks.mock';
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
      const response = await request(app)
        .get('/api/cookbooks')
        .expect(200);

      // then:
      expect(response.body).toEqual([]);
    });

    it('should return all cookbooks when they exist', async ({ app, database }) => {
      // given:
      const cookbookRepository = new CookbookRepository(database);
      const cookbookEntities = cookbookEntityMockList.map(toInsertCookbookEntity);

      await cookbookRepository.insertMany(cookbookEntities);

      // when:
      const response = await request(app)
        .get('/api/cookbooks')
        .expect(200);

      // then:
      expect(response.body).toHaveLength(cookbookEntities.length);
      for (const [index, cookbook] of cookbookEntities.entries()) {
        expect(response.body[index]).toMatchObject(cookbook);
        expect(response.body[index].id).toBeDefined();
      }
    });
  });

  describe('POST /api/cookbooks', () => {
    it('should create a new cookbook with valid data', async ({ app, database }) => {
      // given:
      const addCookbookDto = addCookbookDtoMock;

      // when:
      const response = await request(app)
        .post('/api/cookbooks')
        .send(addCookbookDto)
        .expect(201);

      // then:
      expect(response.body[0]).toMatchObject(addCookbookDto);
      expect(response.body[0].id).toBeDefined();

      const cookbooks = await database.select().from(databaseSchema.cookbooksTable);
      expect(cookbooks).toHaveLength(1);
      expect(cookbooks[0]).toMatchObject(addCookbookDto);
    });

    it('should create cookbook without optional ISBN fields', async ({ app }) => {
      // given:
      const addCookbookDto = addCookbookWithoutIsbnDtoMock;

      // when:
      const response = await request(app)
        .post('/api/cookbooks')
        .send(addCookbookDto)
        .expect(201);

      // then:
      expect(response.body[0]).toMatchObject(addCookbookDto);
      expect(response.body[0].isbn10).toBeNull();
      expect(response.body[0].isbn13).toBeNull();
    });

    it('should return 422 for invalid data', async ({ app }) => {
      // given:
      const invalidAddCookbookDto = {
        ...addCookbookDtoMock,
        title: null,
      };

      // when/then:
      await request(app)
        .post('/api/cookbooks')
        .send(invalidAddCookbookDto)
        .expect(422);
    });

    it('should return 422 when required fields are missing', async ({ app }) => {
      // given:
      const incompleteAddCookbookDto = omit(addCookbookDtoMock, 'authors');

      // when/then:
      await request(app)
        .post('/api/cookbooks')
        .send(incompleteAddCookbookDto)
        .expect(422);
    });
  });

  describe('PATCH /api/cookbooks/:id', () => {
    let cookbookId: string;

    beforeEach(async ({ database }) => {
      const cookbookRepository = new CookbookRepository(database);
      const [cookbookEntity] = await cookbookRepository.insert(insertCookbookEntityMock);
      cookbookId = cookbookEntity.id;
    });

    it('should update cookbook with valid data', async ({ app, database }) => {
      // given:
      const editCookbookDto = toEditCookbookDto(cookbookEntityMockDataFactory.build());

      // when:
      const response = await request(app)
        .patch(`/api/cookbooks/${cookbookId}`)
        .send(editCookbookDto)
        .expect(200);

      // then:
      expect(response.body).toMatchObject(editCookbookDto);
      expect(response.body.id).toBe(cookbookId);

      const [updatedCookbookEntity] = await database.select().from(databaseSchema.cookbooksTable).where(eq(databaseSchema.cookbooksTable.id, cookbookId));
      expect(updatedCookbookEntity).toMatchObject(editCookbookDto);
    });

    it('should return 404 for non-existent cookbook', async ({ app }) => {
      // given:
      const editCookbookDto = toEditCookbookDto(cookbookEntityMockDataFactory.build());

      // when/then:
      await request(app)
        .patch(`/api/cookbooks/${faker.string.uuid()}`)
        .send(editCookbookDto)
        .expect(404);
    });

    it('should return 422 for invalid update data', async ({ app }) => {
      // given:
      const invalidEditCookbookDto = { title: null };

      // when/then:
      await request(app)
        .patch(`/api/cookbooks/${cookbookId}`)
        .send(invalidEditCookbookDto)
        .expect(422);
    });
  });

  describe('DELETE /api/cookbooks/:id', () => {
    let cookbookId: string;

    beforeEach(async ({ database }) => {
      const cookbookRepository = new CookbookRepository(database);
      const [cookbookEntity] = await cookbookRepository.insertMany(cookbookEntityMockList);
      cookbookId = cookbookEntity.id;
    });

    it('should delete existing cookbook', async ({ app, database }) => {
      // when:
      await request(app)
        .delete(`/api/cookbooks/${cookbookId}`)
        .expect(204);

      // then:
      const cookbookEntities = await database.select().from(databaseSchema.cookbooksTable);
      expect(cookbookEntities).toHaveLength(cookbookEntityMockList.length - 1);
    });

    it('should return 404 for non-existent cookbook', async ({ app }) => {
      await request(app)
        .delete(`/api/cookbooks/${faker.string.uuid()}`)
        .expect(404);
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

      // when:
      const response = await request(app)
        .post('/api/cookbooks/identification')
        .attach('backCoverFile', await loadTestFile('backcover1.jpg'), 'backcover1.jpg')
        .expect(200);

      // then:
      expect(response.body).toEqual(expectedBookSearchResult);

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

      // when:
      const response = await request(app)
        .post('/api/cookbooks/identification')
        .attach('backCoverFile', await loadTestFile('backcover1.jpg'), 'backcover1.jpg')
        .expect(422);

      // then:
      expect(response.body).toEqual({
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

      // when:
      const response = await request(app)
        .post('/api/cookbooks/identification')
        .attach('backCoverFile', await loadTestFile('backcover1.jpg'), 'backcover1.jpg')
        .expect(404);

      // then:
      expect(response.body).toEqual({
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
      await request(app)
        .post('/api/cookbooks/identification')
        .expect(422);
    });

    it('should return 422 when file is not an image', async ({ app }) => {
      // given:
      const invalidFileBuffer = Buffer.from('This is not an image');

      // when/then:
      await request(app)
        .post('/api/cookbooks/identification')
        .attach('backCoverFile', invalidFileBuffer, 'test-file.txt')
        .expect(422);
    });
  });
});
