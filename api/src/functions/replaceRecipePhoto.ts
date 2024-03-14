import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../appEnvironment';
import { uploadImage } from '../infrastructure/persistence/imageBlobStorage';
import { updateRecipeEntity } from '../infrastructure/persistence/recipeTableStorage';
import { getStringValue } from '../infrastructure/util/form';

export async function replaceRecipePhoto(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const azureStoragePhotoBlobContainerClient = await appEnvironment.get('azureStoragePhotoBlobContainerClient');
    const azureStorageRecipeTableClient = await appEnvironment.get('azureStorageRecipeTableClient');

    const formData = await request.formData();

    const id = getStringValue(formData, 'id');
    const photoFile = formData.get('photoFile') as unknown as File;

    const photoFileId = await uploadImage(azureStoragePhotoBlobContainerClient, photoFile);

    await updateRecipeEntity(azureStorageRecipeTableClient, {
        id,
        photoFileId
    });

    return {
        body: id
    };
};

app.http('replaceRecipePhoto', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: replaceRecipePhoto
});
