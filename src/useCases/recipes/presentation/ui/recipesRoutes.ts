import { type RouteConfig, index, route } from '@react-router/dev/routes';
import { routeModulePath } from '../../../../common/client/routeConfig';

const pathTo = routeModulePath(import.meta.dirname);

export const recipesRoutes = [
  index(pathTo('RecipeBrowserController.tsx')),
  route('recipes/new', pathTo('RecipeFormController.tsx')),
  route('recipes/from-photo', pathTo('RecipeFromPhotoController.tsx')),
  route('recipes/:recipeId/edit', pathTo('RecipeEditController.tsx')),
  route('cookbooks', pathTo('CookbooksController.tsx')),
  route('cookbooks/:cookbookId', pathTo('CookbookDetailsController.tsx')),
] satisfies RouteConfig;
