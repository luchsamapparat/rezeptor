import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { extractMetadata } from '../infrastructure/api/azureDocumentIntelligence';
import { createRecipeEntity, uploadRecipeFile } from '../infrastructure/persistence/recipe';

export async function addRecipe(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const recipeBlobContainer = await appEnvironment.get('recipeBlobContainer');
    const documentAnalysisApi = appEnvironment.get('documentAnalysisApi');
    const recipeContainer = await appEnvironment.get('recipeContainer');

    const formData = await request.formData();

    const cookbookId = getStringValue(formData, 'cookbookId');
    const recipeFile = formData.get('recipeFile') as unknown as File;

    const recipeFileId = await uploadRecipeFile(recipeBlobContainer, recipeFile);

    const { title, pageNumber } = await extractMetadata(documentAnalysisApi, recipeFile);

    const { id: recipeId } = await createRecipeEntity(recipeContainer, {
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
