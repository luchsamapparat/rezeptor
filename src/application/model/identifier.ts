import z from 'zod';

export const identifierSchema = z.uuid();
export type Identifier = z.infer<typeof identifierSchema>;
