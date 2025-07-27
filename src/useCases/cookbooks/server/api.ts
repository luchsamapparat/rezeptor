import { Router, type RequestHandler } from 'express';

import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export const cookbooksApi = Router();

const schema = z.object({ foo: z.string() });

interface TypedRequest<T extends z.ZodTypeAny> extends Request {
  body: z.infer<T>;
}

const validateSchema = <T extends z.ZodTypeAny>(schema: T): RequestHandler => {
  return (
    request: TypedRequest<T>,
    response: Response,
    next: NextFunction,
  ): void => {
    const validationResult = schema.safeParse(request.body);

    if (!validationResult.success) {
      response.status(422).json({
        message: 'Validation failed',
        errors: validationResult.error.errors,
      });
      return;
    }

    // Overwrite the req.body with validated data
    request.body = validationResult.data;

    next();
  };
};

cookbooksApi.get('/cookbooks', validateSchema(schema), (request: TypedRequest<typeof schema>, response) => {
  console.log(request.body.foo);
  response.json([]);
});
