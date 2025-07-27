import { type RouteConfig, index } from '@react-router/dev/routes';
import { routeModulePath } from '../../../common/client/routeConfig';

const pathTo = routeModulePath(import.meta.dirname);

export const cookbookRoutes = [index(pathTo('CookbooksController.tsx'))] satisfies RouteConfig;
