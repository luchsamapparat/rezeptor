import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { environment } from '../environment';
import { extractBarcode } from '../infrastructure/api/azureDocumentIntelligence';
import { findBook } from '../infrastructure/api/googleBooks';
import { createCookbookEntity } from '../infrastructure/persistence/cookbookTableStorage';
import { getFile } from '../infrastructure/util/form';

export async function addCookbook(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    const formData = await request.formData();

    const backCoverFile = getFile(formData, 'backCoverFile');

    const azureDocumentIntelligenceApiClient = environment.getAzureDocumentIntelligenceApiClient();
    const { ean13 } = await extractBarcode(azureDocumentIntelligenceApiClient, backCoverFile);

    if (ean13 === null) {
        throw new Error(`No EAN 13 barcode found.`);
    }

    const googleBooksApiClient = environment.getGoogleBooksApiClient();
    const book = await findBook(googleBooksApiClient, ean13);

    if (book === null) {
        throw new Error(`No book found for ${ean13}.`);
    }

    const cookbookTableClient = await environment.getTableClient('cookbook');
    const cookbookId = await createCookbookEntity(cookbookTableClient, book);

    return {
        body: cookbookId
    };
};

app.http('addCookbook', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: addCookbook
});
