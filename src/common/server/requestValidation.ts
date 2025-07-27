import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type z from 'zod';

export type RequestSchemas<
  ParamsSchema extends z.ZodType = z.ZodAny,
  QuerySchema extends z.ZodType = z.ZodAny,
  RequestBodySchema extends z.ZodType = z.ZodAny,
> = {
  paramsSchema?: ParamsSchema;
  querySchema?: QuerySchema;
  requestBodySchema?: RequestBodySchema;
};

export type TypedRequest<
  ParamsSchema extends z.ZodType = z.ZodAny,
  QuerySchema extends z.ZodType = z.ZodAny,
  RequestBodySchema extends z.ZodType = z.ZodAny,
> = Omit<Request, 'params' | 'query' | 'body'> & {
  params: z.infer<ParamsSchema>;
  query: z.infer<QuerySchema>;
  body: z.infer<RequestBodySchema>;
};

export function validateRequest<
  ParamsSchema extends z.ZodType = z.ZodAny,
  QuerySchema extends z.ZodType = z.ZodAny,
  RequestBodySchema extends z.ZodType = z.ZodAny,
>({ paramsSchema, querySchema, requestBodySchema }: RequestSchemas<ParamsSchema, QuerySchema, RequestBodySchema>): RequestHandler {
  return (
    req: Request,
    response: Response,
    next: NextFunction,
  ): void => {
    const request = req as TypedRequest<ParamsSchema, QuerySchema, RequestBodySchema>;

    // Validate params if schema provided
    if (paramsSchema) {
      const paramsValidation = paramsSchema.safeParse(request.params);
      if (!paramsValidation.success) {
        response.status(422).json({
          message: 'Invalid path parameters',
          errors: paramsValidation.error.issues,
        });
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (request as any).params = paramsValidation.data;
    }

    // Validate query if schema provided
    if (querySchema) {
      const queryValidation = querySchema.safeParse(request.query);
      if (!queryValidation.success) {
        response.status(422).json({
          message: 'Invalid query parameters',
          errors: queryValidation.error.issues,
        });
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (request as any).query = queryValidation.data;
    }

    // Validate body if schema provided
    if (requestBodySchema) {
      const requestBodyValidation = requestBodySchema.safeParse(request.body);
      if (!requestBodyValidation.success) {
        response.status(422).json({
          message: 'Invalid request body',
          errors: requestBodyValidation.error.issues,
        });
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (request as any).body = requestBodyValidation.data;
    }

    next();
  };
};
