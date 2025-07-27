import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type z from 'zod';

export type RequestSchemas<
  RequestBodySchema extends z.ZodType,
> = {
  requestBodySchema: RequestBodySchema;
};

export interface TypedRequest<T extends z.ZodType> extends Request {
  body: z.infer<T>;
}

export function validateRequest<
  BodySchema extends z.ZodType,
>({ requestBodySchema }: RequestSchemas<BodySchema>): RequestHandler {
  return (
    request: TypedRequest<BodySchema>,
    response: Response,
    next: NextFunction,
  ): void => {
    const requestBodyValidation = requestBodySchema.safeParse(request.body);

    if (!requestBodyValidation.success) {
      response.status(422).json({
        message: 'Invalid request body',
        errors: requestBodyValidation.error.issues,
      });
      return;
    }

    request.body = requestBodyValidation.data;

    next();
  };
};
