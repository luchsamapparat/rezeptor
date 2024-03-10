import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { environment } from '../environment';
import { getRecipeEntities } from '../infrastructure/persistence/recipeTableStorage';

export async function getRecipes(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const recipeTableClient = await environment.getTableClient('recipe');
    const recipes = await getRecipeEntities(recipeTableClient);

    return {
        jsonBody: recipes
    };
};

app.http('getRecipes', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getRecipes
});
