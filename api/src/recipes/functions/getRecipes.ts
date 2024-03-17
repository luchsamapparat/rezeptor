import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getRecipeEntities } from '../infrastructure/persistence/recipe';

export async function getRecipes(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const recipeContainer = await appEnvironment.get('recipeContainer');

    const recipes = await getRecipeEntities(recipeContainer);

    return {
        jsonBody: recipes
    };
};

app.http('getRecipes', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getRecipes
});
