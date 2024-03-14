import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../appEnvironment';
import { getStringValue } from '../infrastructure/util/form';

export async function getRecipePhoto(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const azureStoragePhotoBlobContainerClient = await appEnvironment.get('azureStoragePhotoBlobContainerClient');

    const id = getStringValue(request.query, 'id');

    const blockBlobClient = azureStoragePhotoBlobContainerClient.getBlockBlobClient(id);

    if (!(await blockBlobClient.exists())) {
        return {
            status: 404
        };
    }

    const recipePhotoBuffer = await blockBlobClient.downloadToBuffer();
    const recipePhotoContentType = (await blockBlobClient.getProperties()).contentType ?? null;
    return {
        body: recipePhotoBuffer,
        headers: {
            ...(recipePhotoContentType === null) ? {} : {
                'content-type': recipePhotoContentType
            }
        }
    };
};

app.http('getRecipePhoto', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getRecipePhoto
});
