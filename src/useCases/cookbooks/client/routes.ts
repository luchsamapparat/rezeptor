import { type RouteConfig, index } from '@react-router/dev/routes';
import { getBasePath } from '../../../common/client/routeConfig';

export const cookbookRoutes = [index(getBasePath('CookbooksController.tsx'))] satisfies RouteConfig;
