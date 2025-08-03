import { Hono } from 'hono';
import { createHonoServer } from 'react-router-hono-server/node';
import { initEnvironment } from './application/server/environment';
import { createApiServer } from './bootstrap/apiServer';

export const { app: api } = await createApiServer(initEnvironment(process.env));

const app = new Hono()
  .route('/', api);

export default await createHonoServer({ app });