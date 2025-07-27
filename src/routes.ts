import { type RouteConfig } from '@react-router/dev/routes';
import { useCaseRoutes } from './useCases/routes';

export default [...useCaseRoutes] satisfies RouteConfig;
