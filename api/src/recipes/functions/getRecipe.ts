import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';

const getRecipe: AuthenticatedRequestHandler = async ({ request, requestEnv }) => {
    const recipeRepository = await requestEnv.get('recipeRepository');

    const id = getStringValue(request.query, 'id');

    const recipe = await recipeRepository.get(id);

    return {
        jsonBody: recipe
    };
};

app.http('getRecipe', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(appEnvironment, getRecipe)
});
