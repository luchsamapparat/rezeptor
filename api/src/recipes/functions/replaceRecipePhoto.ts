import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';

const replaceRecipePhoto: AuthenticatedRequestHandler = async ({ request, requestEnv }) => {
    const recipeRepository = await requestEnv.get('recipeRepository');

    const formData = await request.formData();

    const id = getStringValue(formData, 'id');
    const photoFile = formData.get('photoFile') as unknown as File;

    const photoFileId = await recipeRepository.uploadPhotoFile(photoFile);

    await recipeRepository.update(id, {
        photoFileId
    });

    return {
        body: id
    };
};

app.http('replaceRecipePhoto', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(appEnvironment, replaceRecipePhoto)
});
