import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { downloadFile } from '../../common/infrastructure/persistence/azureStorageAccount';
import { getStringValue } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';

const getRecipePhoto: AuthenticatedRequestHandler = async request => {
    const photoBlobContainer = await appEnvironment.get('photoBlobContainer');

    const id = getStringValue(request.query, 'id');

    const recipePhotoFile = await downloadFile(photoBlobContainer, id);

    if (recipePhotoFile === null) {
        return {
            status: 404
        };
    }

    const { fileBuffer, contentType } = recipePhotoFile;

    return {
        body: fileBuffer,
        headers: {
            ...(contentType === null) ? {} : {
                'content-type': contentType
            }
        }
    };
};

app.http('getRecipePhoto', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(getRecipePhoto)
});
