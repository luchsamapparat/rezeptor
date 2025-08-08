import { hc } from 'hono/client';
import type { useCasesApi } from './index';

export const useCasesApiClient = hc<typeof useCasesApi>('/api');
