import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { environment } from '../environment';
import { deleteRecipeEntity } from '../infrastructure/persistence/recipeTableStorage';
import { getStringValue } from '../infrastructure/util/form';

export async function removeRecipe(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const formData = await request.formData();

    const id = getStringValue(formData, 'id');

    const recipeTableClient = await environment.getTableClient('recipe');
    await deleteRecipeEntity(recipeTableClient, id);

    return {
        body: null
    };
};

app.http('removeRecipe', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: removeRecipe
});
