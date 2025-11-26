import type { CookbookAuthor } from '@prisma/client';
export type CookbookAuthorEntity = CookbookAuthor;
export type InsertCookbookAuthorEntity = Omit<CookbookAuthorEntity, 'id'>;
export type UpdateCookbookAuthorEntity = Partial<InsertCookbookAuthorEntity>;
