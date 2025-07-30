import { OpenAPIRegistry, OpenApiGeneratorV3, type RouteConfig } from '@asteasolutions/zod-to-openapi';
import type { RequestHandler } from 'express';
import { z } from './zodOpenApi';

export interface ApiEndpoint {
  path: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  tags?: string[];
  summary?: string;
  description?: string;
  paramsSchema?: z.ZodType;
  querySchema?: z.ZodType;
  requestBodySchema?: z.ZodType;
  responseSchema?: z.ZodType;
  fileUpload?: {
    fieldName: string;
    required?: boolean;
    acceptedMimeTypes?: string[];
    maxSize?: number;
  };
}

export interface OpenAPIConfig {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
}

export class OpenApiSpecGenerator {
  private registry = new OpenAPIRegistry();

  constructor(private config: OpenAPIConfig) {}

  /**
   * Register an API endpoint for OpenAPI spec generation
   */
  registerEndpoint(endpoint: ApiEndpoint): void {
    const route: RouteConfig = {
      method: endpoint.method,
      path: endpoint.path,
      tags: endpoint.tags,
      summary: endpoint.summary,
      description: endpoint.description,
      request: {},
      responses: {
        200: {
          description: 'Success',
        },
      },
    };

    // Add path parameters (cast to the expected type)
    if (endpoint.paramsSchema) {
      route.request!.params = endpoint.paramsSchema as z.ZodObject<z.ZodRawShape>;
    }

    // Add query parameters (cast to the expected type)
    if (endpoint.querySchema) {
      route.request!.query = endpoint.querySchema as z.ZodObject<z.ZodRawShape>;
    }

    // Add request body
    if (endpoint.requestBodySchema) {
      route.request!.body = {
        content: {
          'application/json': {
            schema: endpoint.requestBodySchema,
          },
        },
      };
    }

    // Add file upload support
    if (endpoint.fileUpload) {
      const fileUploadSchema = z.object({
        [endpoint.fileUpload.fieldName]: z.string().describe('File upload'),
      });
      
      route.request!.body = {
        content: {
          'multipart/form-data': {
            schema: this.registry.register(
              `${endpoint.path.replace(/[^a-zA-Z0-9]/g, '')}_Upload`,
              fileUploadSchema,
            ),
          },
        },
      };
    }

    // Add response schema if provided
    if (endpoint.responseSchema) {
      route.responses[200] = {
        description: 'Success',
        content: {
          'application/json': {
            schema: endpoint.responseSchema,
          },
        },
      };
    }

    this.registry.registerPath(route);
  }

  /**
   * Generate the complete OpenAPI specification
   */
  generateSpec(): ReturnType<OpenApiGeneratorV3['generateDocument']> {
    const generator = new OpenApiGeneratorV3(this.registry.definitions);
    return generator.generateDocument(this.config);
  }

  /**
   * Helper method to create endpoints from your createRequestHandler pattern
   */
  static fromRequestHandler(
    path: string,
    method: ApiEndpoint['method'],
    schemas: {
      paramsSchema?: z.ZodType;
      querySchema?: z.ZodType;
      requestBodySchema?: z.ZodType;
      fileUpload?: ApiEndpoint['fileUpload'];
    },
    metadata: {
      tags?: string[];
      summary?: string;
      description?: string;
      responseSchema?: z.ZodType;
    } = {},
  ): ApiEndpoint {
    return {
      path,
      method,
      ...schemas,
      ...metadata,
    };
  }
}

/**
 * Helper function to extract route information from Express handlers
 */
export function extractRouteInfo(handlers: RequestHandler[]): {
  hasValidation: boolean;
  hasFileUpload: boolean;
} {
  // This would need to be enhanced to actually introspect the handlers
  // For now, it's a placeholder for future enhancement
  return {
    hasValidation: handlers.length > 1,
    hasFileUpload: false,
  };
}
