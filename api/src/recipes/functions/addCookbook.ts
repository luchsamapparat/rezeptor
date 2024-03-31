import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { WithoutModelId } from '../../common/model';
import { getFile } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';
import { extractBarcode } from '../infrastructure/api/azureDocumentIntelligence';
import { findBook } from '../infrastructure/api/googleBooks';
import { Cookbook } from '../model';

const addCookbook: AuthenticatedRequestHandler = async ({ request, env, requestEnv }) => {
    const documentAnalysisApi = env.get('documentAnalysisApi');
    const booksApi = env.get('booksApi');
    const cookbookRepository = await requestEnv.get('cookbookRepository');

    const formData = await request.formData();

    const backCoverFile = getFile(formData, 'backCoverFile');

    const { ean13 } = await extractBarcode(documentAnalysisApi, backCoverFile);

    let cookbook: WithoutModelId<Cookbook> = {
        title: '',
        authors: [],
        isbn10: null,
        isbn13: null
    }

    if (ean13 !== null) {
        const book = await findBook(booksApi, ean13);

        if (book !== null) {
            cookbook = book;
        }
    }

    const { id: cookbookId } = await cookbookRepository.create(cookbook);

    return {
        body: cookbookId
    };
};

app.http('addCookbook', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(appEnvironment, addCookbook)
});
