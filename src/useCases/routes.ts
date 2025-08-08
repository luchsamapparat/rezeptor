import { prefix, type RouteConfig } from '@react-router/dev/routes';
import { cookbookManagementRoutes } from './cookbookManagement/client/routes';
import { recipeBrowserRoutes } from './recipeBrowser/client/routes';
import { recipeManagementRoutes } from './recipeManagement/client/routes';

export const useCaseRoutes = [
  ...recipeBrowserRoutes,
  ...prefix('recipes', recipeManagementRoutes),
  ...prefix('cookbooks', cookbookManagementRoutes),
] satisfies RouteConfig;
