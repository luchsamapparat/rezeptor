import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';

const removeRecipe: AuthenticatedRequestHandler = async request => {
    const recipeRepository = await appEnvironment.get('recipeRepository');

    const formData = await request.formData();

    const id = getStringValue(formData, 'id');

    await recipeRepository.delete(id);

    return {
        body: null
    };
};

app.http('removeRecipe', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(removeRecipe)
});
