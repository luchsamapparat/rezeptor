import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import { omit, pick } from 'lodash-es';
import request from 'supertest';
import { describe, expect, vi } from 'vitest';
import { databaseSchema } from '../../../bootstrap/databaseSchema';
import { loadTestFile } from '../../../tests/data/testFile';
import { beforeEach, it } from '../../../tests/integration.test';
import { documentAnalysisClientBeginAnalyzeDocument, DocumentAnalysisClientMock, setupAzureFormRecognizerMock } from '../../../tests/mocks/azureAiFormRecognizer.mock';
import { googleBooksMock, googleBookVolumesListMockFn, setupGoogleBooksMock } from '../../../tests/mocks/googleBooks.mock';
import { CookbookRepository } from '../server/persistence/cookbookRepository';
import { cookbookMock, cookbookMockDataFactory, cookbookMockList, cookbookWithoutIsbnMock } from './data/cookbookMockData';

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
      const repository = new CookbookRepository(database);
      const cookbooks = cookbookMockList;

      await repository.insertMany(cookbooks);

      // when:
      const response = await request(app)
        .get('/api/cookbooks')
        .expect(200);

      // then:
      expect(response.body).toHaveLength(cookbooks.length);
      for (const [index, cookbook] of cookbooks.entries()) {
        expect(response.body[index]).toMatchObject(cookbook);
        expect(response.body[index].id).toBeDefined();
      }
    });
  });

  describe('POST /api/cookbooks', () => {
    it('should create a new cookbook with valid data', async ({ app, database }) => {
      // given:
      const newCookbook = cookbookMock;

      // when:
      const response = await request(app)
        .post('/api/cookbooks')
        .send(newCookbook)
        .expect(201);

      // then:
      expect(response.body[0]).toMatchObject(newCookbook);
      expect(response.body[0].id).toBeDefined();

      const cookbooks = await database.select().from(databaseSchema.cookbooksTable);
      expect(cookbooks).toHaveLength(1);
      expect(cookbooks[0]).toMatchObject(newCookbook);
    });

    it('should create cookbook without optional ISBN fields', async ({ app }) => {
      // given:
      const newCookbook = cookbookWithoutIsbnMock;

      // when:
      const response = await request(app)
        .post('/api/cookbooks')
        .send(newCookbook)
        .expect(201);

      // then:
      expect(response.body[0]).toMatchObject(newCookbook);
      expect(response.body[0].isbn10).toBeNull();
      expect(response.body[0].isbn13).toBeNull();
    });

    it('should return 422 for invalid data', async ({ app }) => {
      // given:
      const invalidCookbook = {
        ...cookbookMock,
        title: null,
      };

      // when/then:
      await request(app)
        .post('/api/cookbooks')
        .send(invalidCookbook)
        .expect(422);
    });

    it('should return 422 when required fields are missing', async ({ app }) => {
      // given:
      const incompleteCookbook = omit(cookbookMock, 'authors');

      // when/then:
      await request(app)
        .post('/api/cookbooks')
        .send(incompleteCookbook)
        .expect(422);
    });
  });

  describe('PATCH /api/cookbooks/:id', () => {
    let cookbookId: string;

    beforeEach(async ({ database }) => {
      const repository = new CookbookRepository(database);
      const [cookbook] = await repository.insert(cookbookMock);
      cookbookId = cookbook.id;
    });

    it('should update cookbook with valid data', async ({ app, database }) => {
      // given:
      const cookbookUpdate = pick(cookbookMockDataFactory.build(), ['title', 'authors']);

      // when:
      const response = await request(app)
        .patch(`/api/cookbooks/${cookbookId}`)
        .send(cookbookUpdate)
        .expect(200);

      // then:
      expect(response.body).toMatchObject(cookbookUpdate);
      expect(response.body.id).toBe(cookbookId);

      const [updatedCookbook] = await database.select().from(databaseSchema.cookbooksTable).where(eq(databaseSchema.cookbooksTable.id, cookbookId));
      expect(updatedCookbook).toMatchObject(cookbookUpdate);
    });

    it('should return 404 for non-existent cookbook', async ({ app }) => {
      // given:
      const cookbookUpdate = pick(cookbookMockDataFactory.build(), ['title', 'authors']);

      // when/then:
      await request(app)
        .patch('/api/cookbooks/non-existent-id')
        .send(cookbookUpdate)
        .expect(404);
    });

    it('should return 422 for invalid update data', async ({ app }) => {
      // given:
      const invalidCookbookUpdate = { title: null };

      // when/then:
      await request(app)
        .patch(`/api/cookbooks/${cookbookId}`)
        .send(invalidCookbookUpdate)
        .expect(422);
    });
  });

  describe('DELETE /api/cookbooks/:id', () => {
    let cookbookId: string;

    beforeEach(async ({ database }) => {
      const repository = new CookbookRepository(database);
      const [cookbook] = await repository.insertMany(cookbookMockList);
      cookbookId = cookbook.id;
    });

    it('should delete existing cookbook', async ({ app, database }) => {
      // when:
      await request(app)
        .delete(`/api/cookbooks/${cookbookId}`)
        .expect(204);

      // then:
      const cookbooks = await database.select().from(databaseSchema.cookbooksTable);
      expect(cookbooks).toHaveLength(cookbookMockList.length - 1);
    });

    it('should return 404 for non-existent cookbook', async ({ app }) => {
      await request(app)
        .delete('/api/cookbooks/non-existent-id')
        .expect(404);
    });
  });

  describe('POST /api/cookbooks/identification', () => {
    it('should identify cookbook from back cover image and return dummy data', async ({ app }) => {
      // given:
      const expectedBookData = {
        title: cookbookMock.title,
        authors: cookbookMock.authors,
        isbn10: cookbookMock.isbn10?.toString() ?? null,
        isbn13: cookbookMock.isbn13?.toString() ?? null,
      };

      const mockEan13 = faker.commerce.isbn({ variant: 13, separator: '' });

      setupAzureFormRecognizerMock({
        ean13: mockEan13,
      });
      setupGoogleBooksMock(expectedBookData);

      // when:
      const response = await request(app)
        .post('/api/cookbooks/identification')
        .attach('backCoverFile', await loadTestFile('backcover1.jpg'), 'backcover1.jpg')
        .expect(200);

      // then:
      expect(response.body).toEqual(expectedBookData);

      expect(documentAnalysisClientBeginAnalyzeDocument).toHaveBeenCalledWith(
        'prebuilt-layout',
        expect.any(ArrayBuffer),
        { features: ['barcodes'] },
      );
      expect(googleBookVolumesListMockFn).toHaveBeenCalledWith({
        q: `isbn:${mockEan13}`,
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
      const mockEan13 = faker.commerce.isbn({ variant: 13, separator: '' });

      setupAzureFormRecognizerMock({
        ean13: mockEan13,
      });
      setupGoogleBooksMock(null);

      // when:
      const response = await request(app)
        .post('/api/cookbooks/identification')
        .attach('backCoverFile', await loadTestFile('backcover1.jpg'), 'backcover1.jpg')
        .expect(404);

      // then:
      expect(response.body).toEqual({
        error: `No book found for the extracted EAN-13 barcode ${mockEan13}.`,
      });

      expect(documentAnalysisClientBeginAnalyzeDocument).toHaveBeenCalledWith(
        'prebuilt-layout',
        expect.any(ArrayBuffer),
        { features: ['barcodes'] },
      );
      expect(googleBookVolumesListMockFn).toHaveBeenCalledWith({
        q: `isbn:${mockEan13}`,
      });
    });

    it('should return 422 when no file is provided', async ({ app }) => {
      await request(app)
        .post('/api/cookbooks/identification')
        .expect(422);
    });

    it('should return 422 when file is not an image', async ({ app }) => {
      // given:
      const textFileBuffer = Buffer.from('This is not an image');

      // when/then:
      await request(app)
        .post('/api/cookbooks/identification')
        .attach('backCoverFile', textFileBuffer, 'test-file.txt')
        .expect(422);
    });
  });
});
