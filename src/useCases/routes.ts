import { type RouteConfig } from '@react-router/dev/routes';
import { recipesRoutes } from './recipes/presentation/ui/recipesRoutes';

export const useCaseRoutes = [
  ...recipesRoutes,
] satisfies RouteConfig;
