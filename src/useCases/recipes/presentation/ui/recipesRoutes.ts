import { index, type RouteConfig } from '@react-router/dev/routes';
import { routeModulePath } from '../../../../common/client/routeConfig';

const pathTo = routeModulePath(import.meta.dirname);

export const recipesRoutes = [
  index(pathTo('RecipeBrowserController.tsx')),
] satisfies RouteConfig;
