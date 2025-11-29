import { type RouteConfig } from '@react-router/dev/routes';
import { adminRoutes } from './recipes/presentation/admin-ui/adminRoutes';
import { recipesRoutes } from './recipes/presentation/ui/recipesRoutes';

export const useCaseRoutes = [
  ...adminRoutes,
  ...recipesRoutes,
] satisfies RouteConfig;
