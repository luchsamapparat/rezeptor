import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';
import { deleteRecipeEntity } from '../infrastructure/persistence/cookbook';

const removeRecipe: AuthenticatedRequestHandler = async request => {
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
    handler: createAuthenticatedRequestHandler(removeRecipe)
});
