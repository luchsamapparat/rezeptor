import type { Response } from 'express';
import type z from 'zod';
import { validateRequest, type RequestSchemas, type TypedRequest } from './requestValidation';

export const createRequestHandler = <
  ParamsSchema extends z.ZodType = z.ZodAny,
  QuerySchema extends z.ZodType = z.ZodAny,
  RequestBodySchema extends z.ZodType = z.ZodAny,
>(
  schemas: RequestSchemas<ParamsSchema, QuerySchema, RequestBodySchema>,
  handler: (request: TypedRequest<ParamsSchema, QuerySchema, RequestBodySchema>, response: Response) => Promise<void>,
) => [
  validateRequest(schemas),
  handler,
];
