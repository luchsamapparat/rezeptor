import type { Response } from 'express';
import type z from 'zod';
import { validateRequest, type RequestSchemas, type TypedRequest } from './requestValidation';

export const createRequestHandler = <T extends RequestSchemas<z.ZodType>>(
  schemas: T,
  handler: (request: TypedRequest<T['requestBodySchema']>, response: Response) => Promise<void>,
) => [
  validateRequest(schemas),
  handler,
];
