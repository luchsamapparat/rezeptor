import { prefix, type RouteConfig } from '@react-router/dev/routes';
import { cookbookRoutes } from './cookbooks/client/routes';
import { recipesRoutes } from './recipes/client/routes';

export const useCaseRoutes = [
  ...prefix('recipes', recipesRoutes),
  ...prefix('cookbooks', cookbookRoutes),
] satisfies RouteConfig;
