import type { RequestHandler } from 'express';

/**
 * Creates a middleware that routes requests to different handlers based on content type.
 * This allows a single endpoint to handle multiple content types with different validation and logic.
 *
 * @param handlerMap - Map of content types to request handler arrays (from createRequestHandler)
 * @returns Express middleware that routes based on Content-Type header
 */
export function createContentTypeRouter(
  handlerMap: Record<string, RequestHandler[]>,
): RequestHandler[] {
  return [
    (request, response, next) => {
      const contentType = request.get('Content-Type') || '';

      // For multipart/form-data (file uploads), match the base type
      const baseContentType = contentType.split(';')[0].trim();

      // Determine which handler to use based on content type
      let selectedHandlers: RequestHandler[] | undefined;

      if (baseContentType === 'multipart/form-data') {
        selectedHandlers = handlerMap['multipart/form-data'];
      }
      else if (baseContentType === 'application/json' || !contentType) {
        // Default to JSON for empty content type (common in tests)
        selectedHandlers = handlerMap['application/json'];
      }
      else {
        // Try to find exact match
        selectedHandlers = handlerMap[baseContentType];
      }

      if (!selectedHandlers) {
        response.status(415).json({
          error: `Unsupported Media Type: ${contentType}`,
          supported: Object.keys(handlerMap),
        });
        return;
      }

      // Execute the selected handler chain
      let currentIndex = 0;

      const executeNext = (error?: unknown): void => {
        if (error) {
          next(error);
          return;
        }

        if (currentIndex >= selectedHandlers!.length) {
          next();
          return;
        }

        const currentHandler = selectedHandlers![currentIndex++];
        currentHandler(request, response, executeNext);
      };

      executeNext();
    },
  ];
}
