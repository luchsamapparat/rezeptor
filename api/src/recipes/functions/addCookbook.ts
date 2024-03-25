import { app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getFile } from '../../common/util/form';
import { AuthenticatedRequestHandler, createAuthenticatedRequestHandler } from '../../handler';
import { extractBarcode } from '../infrastructure/api/azureDocumentIntelligence';
import { findBook } from '../infrastructure/api/googleBooks';

const addCookbook: AuthenticatedRequestHandler = async request => {
    const documentAnalysisApi = appEnvironment.get('documentAnalysisApi');
    const booksApi = appEnvironment.get('booksApi');
    const cookbookRepository = await appEnvironment.get('cookbookRepository');

    const formData = await request.formData();

    const backCoverFile = getFile(formData, 'backCoverFile');

    const { ean13 } = await extractBarcode(documentAnalysisApi, backCoverFile);

    if (ean13 === null) {
        throw new Error(`No EAN 13 barcode found.`);
    }

    const book = await findBook(booksApi, ean13);

    if (book === null) {
        throw new Error(`No book found for ${ean13}.`);
    }

    const { id: cookbookId } = await cookbookRepository.create(book);

    return {
        body: cookbookId
    };
};

app.http('addCookbook', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createAuthenticatedRequestHandler(addCookbook)
});
