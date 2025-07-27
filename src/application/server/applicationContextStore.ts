import { createRequestContextStore } from '~/common/server/requestContextStore';
import type { ApplicationContext } from '../applicationContext';

const applicationContext = createRequestContextStore<ApplicationContext>('ApplicationContext');

export const applicationContextMiddleware = applicationContext.middleware;

export const getApplicationContext = <
  DatabaseSchema extends Record<string, unknown> = Record<string, unknown>,
>() => applicationContext.get() as ApplicationContext<DatabaseSchema>;
