import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../appEnvironment';
import { deleteRecipeEntity } from '../infrastructure/persistence/recipe';
import { getStringValue } from '../infrastructure/util/form';

export async function removeRecipe(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const recipeContainer = await appEnvironment.get('recipeContainer');

    const formData = await request.formData();

    const id = getStringValue(formData, 'id');

    await deleteRecipeEntity(recipeContainer, id);

    return {
        body: null
    };
};

app.http('removeRecipe', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: removeRecipe
});
