import { httpInstrumentationMiddleware } from '@hono/otel';
import { ATTR_URL_FULL } from '@opentelemetry/semantic-conventions/incubating';
import { Hono } from 'hono';
import { createHonoServer } from 'react-router-hono-server/node';
import { initEnvironment } from './application/server/environment';
import { createErrorHandler } from './application/server/errorHandling';
import { createRequestLoggingMiddleware, createRootLogger } from './application/server/logging';
import { createApiServer } from './bootstrap/apiServer';
import { createDatabaseClient } from './common/persistence/database';

const env = initEnvironment(process.env);

const rootLogger = createRootLogger(env);
const databaseClient = createDatabaseClient(env.database.connectionString);

const app = new Hono();

app.use(httpInstrumentationMiddleware({
  ...env.openTelemetry,
  captureRequestHeaders: ['user-agent', 'service-name'],
}));

app.use(createRequestLoggingMiddleware(rootLogger));

app.route('/', await createApiServer({ env, rootLogger, database: databaseClient }));
app.onError(createErrorHandler(rootLogger));

export default await createHonoServer({
  app,
  defaultLogger: false,
  listeningListener: (info) => {
    rootLogger.info({
      [ATTR_URL_FULL]: `http://127.0.0.1:${info.port}`,
    }, 'Server started');
  },
});