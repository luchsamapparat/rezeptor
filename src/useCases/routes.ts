import { type RouteConfig } from '@react-router/dev/routes';
import { recipesRoutes } from './recipes/client/routes';

export const useCaseRoutes = [
  ...recipesRoutes,
] satisfies RouteConfig;
