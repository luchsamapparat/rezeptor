import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { environment } from '../environment';
import { getRecipeEntity } from '../infrastructure/persistence/recipeTableStorage';
import { getStringValue } from '../infrastructure/util/form';

export async function getRecipe(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const id = getStringValue(request.query, 'id');

    const recipeTableClient = await environment.getTableClient('recipe');
    const recipe = await getRecipeEntity(recipeTableClient, id);

    return {
        jsonBody: recipe
    };
};

app.http('getRecipe', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getRecipe
});
