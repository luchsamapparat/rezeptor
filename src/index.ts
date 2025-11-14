import { httpInstrumentationMiddleware } from '@hono/otel';
import { ATTR_URL_FULL } from '@opentelemetry/semantic-conventions/incubating';
import { Hono } from 'hono';
import { createHonoServer } from 'react-router-hono-server/node';
import { initEnvironment } from './application/server/environment';
import { createRequestLoggingMiddleware, createRootLogger } from './application/server/logging';
import { createApiServer } from './bootstrap/apiServer';

const env = initEnvironment(process.env);

const rootLogger = createRootLogger(env);

const app = new Hono();

app.use(httpInstrumentationMiddleware({
  ...env.openTelemetry,
  captureRequestHeaders: ['user-agent', 'service-name'],
}));

app.use(createRequestLoggingMiddleware(rootLogger));

export const { app: api } = await createApiServer({ env, rootLogger });

app.route('/', api);

export default await createHonoServer({
  app,
  defaultLogger: false,
  listeningListener: (info) => {
    rootLogger.info({
      [ATTR_URL_FULL]: `http://127.0.0.1:${info.port}`,
    }, 'Server started');
  },
});