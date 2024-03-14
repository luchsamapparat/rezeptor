import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../appEnvironment';
import { extractMetadata } from '../infrastructure/api/azureDocumentIntelligence';
import { uploadImage } from '../infrastructure/persistence/imageBlobStorage';
import { createRecipeEntity } from '../infrastructure/persistence/recipeTableStorage';
import { getStringValue } from '../infrastructure/util/form';

export async function addRecipe(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const azureStorageRecipeBlobContainerClient = await appEnvironment.get('azureStorageRecipeBlobContainerClient');
    const azureDocumentIntelligenceApiClient = appEnvironment.get('azureDocumentIntelligenceApiClient');
    const azureStorageRecipeTableClient = await appEnvironment.get('azureStorageRecipeTableClient');

    const formData = await request.formData();

    const cookbookId = getStringValue(formData, 'cookbookId');
    const recipeFile = formData.get('recipeFile') as unknown as File;

    const recipeFileId = await uploadImage(azureStorageRecipeBlobContainerClient, recipeFile);

    const { title, pageNumber } = await extractMetadata(azureDocumentIntelligenceApiClient, recipeFile);

    const recipeId = await createRecipeEntity(azureStorageRecipeTableClient, {
        title: title ?? '',
        photoFileId: null,
        recipeFileId,
        cookbookId,
        pageNumber
    });

    return {
        body: recipeId
    };
};

app.http('addRecipe', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: addRecipe
});
