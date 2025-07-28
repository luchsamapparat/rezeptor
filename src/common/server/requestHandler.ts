import type { RequestHandler, Response } from 'express';
import multer from 'multer';
import { AsyncResource } from 'node:async_hooks';
import type z from 'zod';
import { validateRequest, type FileUploadValidationConfig, type RequestSchemas, type TypedRequest } from './requestValidation';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

export const createRequestHandler = <
  ParamsSchema extends z.ZodType = z.ZodAny,
  QuerySchema extends z.ZodType = z.ZodAny,
  RequestBodySchema extends z.ZodType = z.ZodAny,
  FileUpload extends FileUploadValidationConfig | undefined = undefined,
>(
  schemas: RequestSchemas<ParamsSchema, QuerySchema, RequestBodySchema, FileUpload>,
  handler: (request: TypedRequest<ParamsSchema, QuerySchema, RequestBodySchema, FileUpload>, response: Response) => Promise<void>,
): RequestHandler[] => {
  const middlewares: RequestHandler[] = [];

  // Add file upload middleware if file upload is configured
  if (schemas.fileUpload) {
    middlewares.push(
      ensureAsyncContext(upload.single(schemas.fileUpload!.fieldName)),
    );
  }

  // Add validation middleware
  middlewares.push(validateRequest(schemas));

  // Add the handler with proper type casting
  middlewares.push(handler as unknown as RequestHandler);

  return middlewares;
};

/** @see https://github.com/expressjs/multer/issues/814#issuecomment-1218998366 */
function ensureAsyncContext(middleware: RequestHandler): RequestHandler {
  return (request, response, next) => middleware(request, response, AsyncResource.bind(next));
}