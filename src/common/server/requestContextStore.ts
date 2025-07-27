import { isFunction, isUndefined } from 'lodash-es';
import { AsyncLocalStorage } from 'node:async_hooks';

import type { NextFunction, Request, Response } from 'express';

export function createRequestContextStore<T>(name: string) {
  const asyncLocalStorage = new AsyncLocalStorage<T | undefined>();

  return {
    middleware(value: T | (() => T)) {
      return (request: Request, response: Response, next: NextFunction) => asyncLocalStorage.run(
        isFunction(value) ? value() : value,
        next,
      );
    },

    get() {
      const store = asyncLocalStorage.getStore();
      if (isUndefined(store)) {
        throw new Error(`${name} context not provided.`);
      }
      return store;
    },
  };
}
