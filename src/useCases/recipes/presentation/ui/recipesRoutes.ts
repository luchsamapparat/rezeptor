import { index, layout, route, type RouteConfig } from '@react-router/dev/routes';
import { routeModulePath } from '../../../../common/client/routeConfig';

const pathTo = routeModulePath(import.meta.dirname);

export const recipesRoutes = [
  layout(pathTo('RecipeBrowserController.tsx'), [
    index(pathTo('RecipeBrowserIndexRoute.tsx')),
    route('recipes/new', pathTo('NewRecipeRoute.tsx')),
    route('recipes/remember', pathTo('RememberFoodRoute.tsx')),
    route('recipes/:recipeId', pathTo('RecipeDetailsRoute.tsx')),
    route('recipes/:recipeId/complete', pathTo('CompleteRecipeRoute.tsx')),
  ]),
] satisfies RouteConfig;
