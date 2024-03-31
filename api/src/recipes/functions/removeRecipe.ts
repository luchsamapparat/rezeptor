import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';

const removeRecipe: AuthenticatedRequestHandler = async ({ request, requestEnv }) => {
    const recipeRepository = await requestEnv.get('recipeRepository');

    const formData = await request.formData();

    const id = getStringValue(formData, 'id');

    const recipe = await recipeRepository.get(id);

    if (recipe !== null) {
        await recipeRepository.delete(id);

        if (recipe.photoFileId !== null) {
            await recipeRepository.deletePhotoFile(recipe.photoFileId);
        }

        if (recipe.recipeFileId !== null) {
            await recipeRepository.deleteRecipeFile(recipe.recipeFileId);
        }
    }


    return {
        body: null
    };
};

app.http('removeRecipe', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(appEnvironment, removeRecipe)
});
