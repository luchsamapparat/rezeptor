import type { CookbookAuthor } from '../../../../common/persistence/generated/client';
export type CookbookAuthorEntity = CookbookAuthor;
export type InsertCookbookAuthorEntity = Omit<CookbookAuthorEntity, 'id'>;
export type UpdateCookbookAuthorEntity = Partial<InsertCookbookAuthorEntity>;
