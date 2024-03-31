import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';
import { extractMetadata } from '../infrastructure/api/azureDocumentIntelligence';

const addRecipe: AuthenticatedRequestHandler = async ({ request, env, requestEnv }) => {
    const recipeRepository = await requestEnv.get('recipeRepository');
    const documentAnalysisApi = env.get('documentAnalysisApi');

    const formData = await request.formData();

    const cookbookId = getStringValue(formData, 'cookbookId');
    const recipeFile = formData.get('recipeFile') as unknown as File;

    const recipeFileId = await recipeRepository.uploadRecipeFile(recipeFile);

    const { title, pageNumber } = await extractMetadata(documentAnalysisApi, recipeFile);

    const { id: recipeId } = await recipeRepository.create({
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
    handler: createAuthenticatedRequestHandler(appEnvironment, addRecipe)
});
