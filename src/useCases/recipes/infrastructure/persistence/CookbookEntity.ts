import type { Cookbook } from '@prisma/client';
export type CookbookEntity = Cookbook;
export type InsertCookbookEntity = Omit<CookbookEntity, 'id'>;
export type UpdateCookbookEntity = Partial<InsertCookbookEntity>;
