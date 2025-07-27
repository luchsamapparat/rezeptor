import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type z from 'zod';

export interface TypedRequest<T extends z.ZodTypeAny> extends Request {
  body: z.infer<T>;
}

export function validateRequest<
  RequestBodySchema extends z.ZodTypeAny,
>({ requestBodySchema }: { requestBodySchema: RequestBodySchema }): RequestHandler {
  return (
    request: TypedRequest<RequestBodySchema>,
    response: Response,
    next: NextFunction,
  ): void => {
    const requestBodyValidation = requestBodySchema.safeParse(request.body);

    if (!requestBodyValidation.success) {
      response.status(422).json({
        message: 'Invalid request body',
        errors: requestBodyValidation.error.errors,
      });
      return;
    }

    request.body = requestBodyValidation.data;

    next();
  };
};
