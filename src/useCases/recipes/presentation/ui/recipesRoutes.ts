import { index, route, type RouteConfig } from '@react-router/dev/routes';
import { routeModulePath } from '../../../../common/client/routeConfig';

const pathTo = routeModulePath(import.meta.dirname);

export const recipesRoutes = [
  index(pathTo('RecipeBrowserController.tsx')),
  route('img', pathTo('img.tsx')),
  route('div', pathTo('div.tsx')),
] satisfies RouteConfig;
