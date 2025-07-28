import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type z from 'zod';
import { isAcceptedMimeType } from './mimeType';

type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  message: string;
  errors?: z.ZodIssue[];
};

export type FileUploadValidationConfig = {
  fieldName: string;
  required?: boolean;
  acceptedMimeTypes?: string[];
  maxSize?: number;
};

export type RequestSchemas<
  ParamsSchema extends z.ZodType = z.ZodAny,
  QuerySchema extends z.ZodType = z.ZodAny,
  RequestBodySchema extends z.ZodType = z.ZodAny,
  FileUpload extends FileUploadValidationConfig | undefined = undefined,
> = {
  paramsSchema?: ParamsSchema;
  querySchema?: QuerySchema;
  requestBodySchema?: RequestBodySchema;
  fileUpload?: FileUpload;
};

export type TypedRequest<
  ParamsSchema extends z.ZodType = z.ZodAny,
  QuerySchema extends z.ZodType = z.ZodAny,
  RequestBodySchema extends z.ZodType = z.ZodAny,
  FileUpload extends FileUploadValidationConfig | undefined = undefined,
> = Omit<Request, 'params' | 'query' | 'body'> & {
  params: z.infer<ParamsSchema>;
  query: z.infer<QuerySchema>;
  body: z.infer<RequestBodySchema>;
} & (FileUpload extends FileUploadValidationConfig
  ? FileUpload['required'] extends false
    ? { file?: File }
    : { file: File }
  : NonNullable<unknown>
);

function validateZodSchema<T>(
  data: unknown,
  schema: z.ZodType<T>,
  errorMessage: string,
): ValidationResult<T> {
  const validation = schema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: errorMessage,
      errors: validation.error.issues,
    };
  }
  return {
    success: true,
    data: validation.data,
  };
}

function validateFileUpload(
  multerFile: Express.Multer.File | undefined,
  config: FileUploadValidationConfig,
): ValidationResult<File | undefined> {
  // Check if file is required but missing
  if (config.required !== false && !multerFile) {
    return {
      success: false,
      message: `No ${config.fieldName} provided`,
    };
  }

  if (!multerFile) {
    return {
      success: true,
      data: undefined,
    };
  }

  // Check MIME type if specified
  if (config.acceptedMimeTypes && !isAcceptedMimeType(multerFile.mimetype, config.acceptedMimeTypes)) {
    return {
      success: false,
      message: `File must be of type: ${config.acceptedMimeTypes.join(', ')}`,
    };
  }

  // Check file size if specified
  if (config.maxSize && multerFile.size > config.maxSize) {
    return {
      success: false,
      message: `File size must be less than ${config.maxSize} bytes`,
    };
  }

  // Convert multer file to native File instance
  const nativeFile = new File([multerFile.buffer], multerFile.originalname, {
    type: multerFile.mimetype,
  });

  return {
    success: true,
    data: nativeFile,
  };
}

function sendValidationError(response: Response, result: ValidationResult<unknown>): void {
  if (result.success) return;

  const responseBody = result.errors
    ? { message: result.message, errors: result.errors }
    : { message: result.message };

  response.status(422).json(responseBody);
}

export function validateRequest<
  ParamsSchema extends z.ZodType = z.ZodAny,
  QuerySchema extends z.ZodType = z.ZodAny,
  RequestBodySchema extends z.ZodType = z.ZodAny,
  FileUploadConfigType extends FileUploadValidationConfig | undefined = undefined,
>({ paramsSchema, querySchema, requestBodySchema, fileUpload }: RequestSchemas<ParamsSchema, QuerySchema, RequestBodySchema, FileUploadConfigType>): RequestHandler {
  return (
    req: Request,
    response: Response,
    next: NextFunction,
  ): void => {
    const request = req as unknown as TypedRequest<ParamsSchema, QuerySchema, RequestBodySchema, FileUploadConfigType>;

    // Validate params if schema provided
    if (paramsSchema) {
      const paramsValidation = validateZodSchema(request.params, paramsSchema, 'Invalid path parameters');
      if (!paramsValidation.success) {
        sendValidationError(response, paramsValidation);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (request as any).params = paramsValidation.data;
    }

    // Validate query if schema provided
    if (querySchema) {
      const queryValidation = validateZodSchema(request.query, querySchema, 'Invalid query parameters');
      if (!queryValidation.success) {
        sendValidationError(response, queryValidation);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (request as any).query = queryValidation.data;
    }

    // Validate body if schema provided
    if (requestBodySchema) {
      const bodyValidation = validateZodSchema(request.body, requestBodySchema, 'Invalid request body');
      if (!bodyValidation.success) {
        sendValidationError(response, bodyValidation);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (request as any).body = bodyValidation.data;
    }

    // Validate file upload if config provided
    if (fileUpload) {
      const multerFile = (req as Request & { file?: Express.Multer.File }).file;
      const fileValidation = validateFileUpload(multerFile, fileUpload);

      if (!fileValidation.success) {
        sendValidationError(response, fileValidation);
        return;
      }

      if (fileValidation.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (request as any).file = fileValidation.data;
      }
    }

    next();
  };
};
