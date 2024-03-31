import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';

const getRecipes: AuthenticatedRequestHandler = async ({ request, requestEnv }) => {
    const recipeRepository = await requestEnv.get('recipeRepository');

    const recipes = await recipeRepository.getAll();

    return {
        jsonBody: recipes
    };
};

app.http('getRecipes', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(appEnvironment, getRecipes)
});
