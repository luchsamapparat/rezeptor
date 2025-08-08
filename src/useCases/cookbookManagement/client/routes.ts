import { type RouteConfig, index } from '@react-router/dev/routes';
import { routeModulePath } from '../../../common/client/routeConfig';

const pathTo = routeModulePath(import.meta.dirname);

export const cookbookManagementRoutes = [index(pathTo('CookbookManagementController.tsx'))] satisfies RouteConfig;
