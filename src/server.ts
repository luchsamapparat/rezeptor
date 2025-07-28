import { initEnvironment } from './application/environment';
import { createServer } from './bootstrap/server';

export const { app } = await createServer(initEnvironment(process.env));
