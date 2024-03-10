import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { environment } from '../environment';
import { uploadImage } from '../infrastructure/persistence/imageBlobStorage';
import { updateRecipeEntity } from '../infrastructure/persistence/recipeTableStorage';
import { getStringValue } from '../infrastructure/util/form';

export async function replaceRecipePhoto(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const formData = await request.formData();

    const id = getStringValue(formData, 'id');
    const photoFile = formData.get('photoFile') as unknown as File;

    const photoBlobContainerClient = environment.getBlobContainerClient('photo');
    const photoFileId = await uploadImage(await photoBlobContainerClient, photoFile);

    const recipeTableClient = await environment.getTableClient('recipe');
    await updateRecipeEntity(recipeTableClient, {
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
