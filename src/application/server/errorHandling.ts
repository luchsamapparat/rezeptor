import { ATTR_EXCEPTION_MESSAGE, ATTR_EXCEPTION_STACKTRACE, ATTR_EXCEPTION_TYPE, ATTR_HTTP_ROUTE } from '@opentelemetry/semantic-conventions/incubating';
import type { Env, ErrorHandler } from 'hono';
import { serializeError } from 'serialize-error';
import { ExternalServiceError, NotFoundError, ValidationError } from '../../common/server/error';
import type { Logger } from './logging';

export function createErrorHandler<E extends Env = Env>(log: Logger): ErrorHandler<E> {
  return (err, c) => {
    if (err instanceof NotFoundError) {
      log.warn({
        [ATTR_EXCEPTION_TYPE]: err.constructor.name,
        [ATTR_EXCEPTION_MESSAGE]: err.message,
        [ATTR_HTTP_ROUTE]: c.req.path,
      }, 'Resource not found');
      return c.json({ error: err.message }, 404);
    }

    if (err instanceof ValidationError) {
      log.warn({
        [ATTR_EXCEPTION_TYPE]: err.constructor.name,
        [ATTR_EXCEPTION_MESSAGE]: err.message,
        [ATTR_HTTP_ROUTE]: c.req.path,
      }, 'Validation error');
      return c.json({ error: err.message }, 422);
    }

    if (err instanceof ExternalServiceError) {
      const errorResponse = err.cause instanceof Error ? serializeError(err.cause) : serializeError;
      log.error({
        [ATTR_EXCEPTION_TYPE]: err.constructor.name,
        [ATTR_EXCEPTION_MESSAGE]: err.message,
        [ATTR_HTTP_ROUTE]: c.req.path,
        cause: errorResponse,
      }, 'External service error');
      return c.json({ error: err.message, cause: errorResponse }, 500);
    }

    log.error({
      [ATTR_EXCEPTION_TYPE]: err.constructor.name,
      [ATTR_EXCEPTION_MESSAGE]: err.message,
      [ATTR_HTTP_ROUTE]: c.req.path,
      [ATTR_EXCEPTION_STACKTRACE]: err.stack,
    }, 'Unhandled error');
    return c.json({ error: 'Internal server error' }, 500);
  };
}