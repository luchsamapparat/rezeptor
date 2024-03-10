import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { environment } from '../environment';
import { extractMetadata } from '../infrastructure/api/azureDocumentIntelligence';
import { uploadImage } from '../infrastructure/persistence/imageBlobStorage';
import { createRecipeEntity } from '../infrastructure/persistence/recipeTableStorage';
import { getStringValue } from '../infrastructure/util/form';

export async function addRecipe(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const formData = await request.formData();

    const cookbookId = getStringValue(formData, 'cookbookId');
    const recipeFile = formData.get('recipeFile') as unknown as File;

    const recipeBlobContainerClient = environment.getBlobContainerClient('recipe');
    const recipeFileId = await uploadImage(await recipeBlobContainerClient, recipeFile);

    const azureDocumentIntelligenceApiClient = environment.getAzureDocumentIntelligenceApiClient();
    const { title, pageNumber } = await extractMetadata(azureDocumentIntelligenceApiClient, recipeFile);

    const recipeTableClient = await environment.getTableClient('recipe');
    const recipeId = await createRecipeEntity(recipeTableClient, {
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
