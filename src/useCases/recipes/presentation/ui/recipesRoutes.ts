import { type RouteConfig, index, route } from '@react-router/dev/routes';
import { routeModulePath } from '../../../../common/client/routeConfig';

const pathTo = routeModulePath(import.meta.dirname);

export const recipesRoutes = [
  index(pathTo('RecipeBrowserController.tsx')),
  route('cookbooks', pathTo('CookbooksController.tsx')),
  route('cookbooks/:cookbookId', pathTo('CookbookDetailsController.tsx')),
] satisfies RouteConfig;
