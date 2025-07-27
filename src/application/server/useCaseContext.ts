import type { NextFunction, Request, Response } from 'express';
import { createRequestContextStore } from '../../common/server/requestContextStore';
import type { ApplicationContext } from '../applicationContext';
import { getApplicationContext } from './applicationContextStore';

/**
 * Creates a use case context middleware and getter for a specific database schema
 * @param contextName The name of the context for debugging purposes
 * @returns An object with the middleware function and context getter
 */
export function createUseCaseContext<DatabaseSchema extends Record<string, unknown>>(
  contextName: string,
) {
  const useCaseStore = createRequestContextStore<ApplicationContext<DatabaseSchema>>(contextName);

  return {
    middleware(request: Request, response: Response, next: NextFunction) {
      const applicationContext = getApplicationContext<DatabaseSchema>();
      return useCaseStore.middleware(applicationContext)(request, response, next);
    },
    get() {
      return useCaseStore.get();
    },
  };
}
