import { type RouteConfig } from '@react-router/dev/routes';
import { adminRoutes } from './recipes/presentation/admin-ui/adminRoutes';

export const useCaseRoutes = [
  ...adminRoutes,
] satisfies RouteConfig;
