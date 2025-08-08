import { type RouteConfig, index } from '@react-router/dev/routes';
import { routeModulePath } from '../../../common/client/routeConfig';

const pathTo = routeModulePath(import.meta.dirname);

export const recipeManagementRoutes = [index(pathTo('RecipeManagementController.tsx'))] satisfies RouteConfig;
