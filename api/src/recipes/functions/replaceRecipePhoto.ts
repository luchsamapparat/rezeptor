import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';
import { updateRecipeEntity, uploadPhotoFile } from '../infrastructure/persistence/recipe';

const replaceRecipePhoto: AuthenticatedRequestHandler = async request => {
    const photoBlobContainer = await appEnvironment.get('photoBlobContainer');
    const recipeContainer = await appEnvironment.get('recipeContainer');

    const formData = await request.formData();

    const id = getStringValue(formData, 'id');
    const photoFile = formData.get('photoFile') as unknown as File;

    const photoFileId = await uploadPhotoFile(photoBlobContainer, photoFile);

    await updateRecipeEntity(recipeContainer, id, {
        photoFileId
    });

    return {
        body: id
    };
};

app.http('replaceRecipePhoto', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(replaceRecipePhoto)
});
