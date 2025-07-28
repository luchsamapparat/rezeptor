import { eq } from 'drizzle-orm';
import { omit, pick } from 'lodash-es';
import request from 'supertest';
import { describe, expect } from 'vitest';
import { databaseSchema } from '../../../bootstrap/databaseSchema';
import { beforeEach, it } from '../../../tests/integration.test';
import { CookbookRepository } from '../server/persistence/cookbookRepository';
import { cookbookMock, cookbookMockDataFactory, cookbookMockList, cookbookWithoutIsbnMock } from './data/cookbookMockData';

describe('Cookbooks API Integration Tests', () => {
  describe('GET /api/cookbooks', () => {
    it('should return empty array when no cookbooks exist', async ({ app }) => {
      const response = await request(app)
        .get('/api/cookbooks')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all cookbooks when they exist', async ({ app, database }) => {
      const repository = new CookbookRepository(database);
      const cookbooks = cookbookMockList;

      await repository.insertMany(cookbooks);

      const response = await request(app)
        .get('/api/cookbooks')
        .expect(200);

      expect(response.body).toHaveLength(cookbooks.length);
      for (const [index, cookbook] of cookbooks.entries()) {
        expect(response.body[index]).toMatchObject(cookbook);
        expect(response.body[index].id).toBeDefined();
      }
    });
  });

  describe('POST /api/cookbooks', () => {
    it('should create a new cookbook with valid data', async ({ app, database }) => {
      const newCookbook = cookbookMock;

      const response = await request(app)
        .post('/api/cookbooks')
        .send(newCookbook)
        .expect(201);

      expect(response.body[0]).toMatchObject(newCookbook);
      expect(response.body[0].id).toBeDefined();

      const cookbooks = await database.select().from(databaseSchema.cookbooksTable);
      expect(cookbooks).toHaveLength(1);
      expect(cookbooks[0]).toMatchObject(newCookbook);
    });

    it('should create cookbook without optional ISBN fields', async ({ app }) => {
      const newCookbook = cookbookWithoutIsbnMock;

      const response = await request(app)
        .post('/api/cookbooks')
        .send(newCookbook)
        .expect(201);

      expect(response.body[0]).toMatchObject(newCookbook);
      expect(response.body[0].isbn10).toBeNull();
      expect(response.body[0].isbn13).toBeNull();
    });

    it('should return 422 for invalid data', async ({ app }) => {
      const invalidCookbook = {
        ...cookbookMock,
        title: null,
      };

      await request(app)
        .post('/api/cookbooks')
        .send(invalidCookbook)
        .expect(422);
    });

    it('should return 422 when required fields are missing', async ({ app }) => {
      const incompleteCookbook = omit(cookbookMock, 'authors');

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
      const cookbookUpdate = pick(cookbookMockDataFactory.build(), ['title', 'authors']);

      const response = await request(app)
        .patch(`/api/cookbooks/${cookbookId}`)
        .send(cookbookUpdate)
        .expect(200);

      expect(response.body).toMatchObject(cookbookUpdate);
      expect(response.body.id).toBe(cookbookId);

      const [updatedCookbook] = await database.select().from(databaseSchema.cookbooksTable).where(eq(databaseSchema.cookbooksTable.id, cookbookId));
      expect(updatedCookbook).toMatchObject(cookbookUpdate);
    });

    it('should return 404 for non-existent cookbook', async ({ app }) => {
      const cookbookUpdate = pick(cookbookMockDataFactory.build(), ['title', 'authors']);

      await request(app)
        .patch('/api/cookbooks/non-existent-id')
        .send(cookbookUpdate)
        .expect(404);
    });

    it('should return 422 for invalid update data', async ({ app }) => {
      const invalidCookbookUpdate = { title: null };

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
      await request(app)
        .delete(`/api/cookbooks/${cookbookId}`)
        .expect(204);

      const cookbooks = await database.select().from(databaseSchema.cookbooksTable);
      expect(cookbooks).toHaveLength(cookbookMockList.length - 1);
    });

    it('should return 404 for non-existent cookbook', async ({ app }) => {
      await request(app)
        .delete('/api/cookbooks/non-existent-id')
        .expect(404);
    });
  });
});
