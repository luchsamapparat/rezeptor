import { text, type ReferenceConfig } from 'drizzle-orm/sqlite-core';

export const key = () => text();
export const primaryKey = () => key().primaryKey();
export const foreignKey = (ref: ReferenceConfig['ref'], actions?: ReferenceConfig['actions']) => key().references(ref, actions);
