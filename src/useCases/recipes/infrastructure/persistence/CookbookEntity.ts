import type { Cookbook } from '../../../../common/persistence/generated/client';
export type CookbookEntity = Cookbook;
export type InsertCookbookEntity = Omit<CookbookEntity, 'id'>;
export type UpdateCookbookEntity = Partial<InsertCookbookEntity>;
