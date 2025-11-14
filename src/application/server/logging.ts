import {
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  ATTR_HTTP_ROUTE,
} from '@opentelemetry/semantic-conventions/incubating';
import type { MiddlewareHandler } from 'hono';
import pino, { type Logger } from 'pino';
import type { Environment } from './environment';

export type { Logger } from 'pino';
export const logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'] as const;
export type LogLevel = typeof logLevels[number];

export function createRootLogger(env: Environment): pino.Logger {
  return pino({
    level: env.logging.level,
    formatters: {
      level: label => ({ level: label }),
      bindings: bindings => ({
        pid: bindings.pid,
        host: bindings.hostname,
      }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      service: env.openTelemetry.serviceName,
      environment: env.nodeEnv,
    },
    ...(env.nodeEnv === 'development' && {
      transport: {
        target: 'hono-pino/debug-log',
      },
    }),
  });
}

/**
 * Creates a middleware function for request/response logging at trace level.
 * Only logs when the configured log level is 'trace'.
 */
export function createRequestLoggingMiddleware(logger: Logger): MiddlewareHandler {
  return async (c, next) => {
    if (logger.isLevelEnabled('trace')) {
      const start = Date.now();
      logger.trace({
        [ATTR_HTTP_REQUEST_METHOD]: c.req.method,
        [ATTR_HTTP_ROUTE]: c.req.path,
      }, 'Request started');
      await next();
      const duration = Date.now() - start;
      logger.trace({
        [ATTR_HTTP_REQUEST_METHOD]: c.req.method,
        [ATTR_HTTP_ROUTE]: c.req.path,
        [ATTR_HTTP_RESPONSE_STATUS_CODE]: c.res.status,
        'rezeptor.http.duration_ms': duration,
      }, 'Request completed');
    }
    else {
      await next();
    }
  };
}
