import { createRequestContext } from './requestContext';

/**
 * Generic Context Store using AsyncLocalStorage
 *
 * This module provides a generic way to create request-scoped context stores
 * without knowing about specific application context types.
 *
 * Usage:
 * ```typescript
 * // Create a context store for any type
 * const myContextStore = createContextStore<MyContextType>('MyContext');
 *
 * // Use middleware to inject context
 * app.use(myContextStore.middleware(myContextValue));
 *
 * // Access context in handlers
 * const context = myContextStore.get();
 * ```
 */

/**
 * Create a context store for any type T
 * This is a generic factory function that doesn't depend on specific application types
 */
export function createContextStore<T>(name: string) {
  const contextStore = createRequestContext<T>(name);
  
  return {
    middleware: contextStore.middleware,
    /**
     * Get the current context from AsyncLocalStorage.
     * @throws {Error} If called outside of a request context
     */
    get(): T {
      return contextStore.get();
    },
  };
}
