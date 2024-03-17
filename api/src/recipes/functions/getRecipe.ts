import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { getRecipeEntity } from '../infrastructure/persistence/recipe';

export async function getRecipe(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const recipeContainer = await appEnvironment.get('recipeContainer');

    const id = getStringValue(request.query, 'id');

    const recipe = await getRecipeEntity(recipeContainer, id);

    return {
        jsonBody: recipe
    };
};

app.http('getRecipe', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getRecipe
});
