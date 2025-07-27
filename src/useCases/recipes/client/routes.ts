import { type RouteConfig, index } from '@react-router/dev/routes';
import { getBasePath } from '../../../common/client/routeConfig';

export const recipesRoutes = [index(getBasePath('RecipesController.tsx'))] satisfies RouteConfig;
