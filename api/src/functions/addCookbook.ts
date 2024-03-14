import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../appEnvironment';
import { extractBarcode } from '../infrastructure/api/azureDocumentIntelligence';
import { findBook } from '../infrastructure/api/googleBooks';
import { createCookbookEntity } from '../infrastructure/persistence/cookbook';
import { getFile } from '../infrastructure/util/form';

export async function addCookbook(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const documentAnalysisApi = appEnvironment.get('documentAnalysisApi');
    const booksApi = appEnvironment.get('booksApi');
    const cookbookContainer = await appEnvironment.get('cookbookContainer');

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

    const cookbookId = await createCookbookEntity(cookbookContainer, book);

    return {
        body: cookbookId
    };
};

app.http('addCookbook', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: addCookbook
});
