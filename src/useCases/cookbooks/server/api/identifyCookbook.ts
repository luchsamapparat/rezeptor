import { isNull } from 'lodash-es';
import { createRequestHandler } from '../../../../common/server/requestHandler';
import { cookbooksContext } from '../cookbooksContext';

export const identifyCookbook = createRequestHandler(
  {
    fileUpload: {
      fieldName: 'backCoverFile',
      required: true,
      acceptedMimeTypes: ['image/*'],
    },
  },
  async (request, response) => {
    const { documentAnalysisClient, bookSearchClient } = cookbooksContext.get();

    const { ean13 } = await documentAnalysisClient.extractBarcode(request.file);

    if (isNull(ean13)) {
      response.status(422).json({ error: 'No EAN-13 barcode found in uploaded image.' });
      return;
    }

    const book = await bookSearchClient.findBook(ean13);

    if (isNull(book)) {
      response.status(404).json({ error: `No book found for the extracted EAN-13 barcode ${ean13}.` });
      return;
    }

    response.status(200).json(book);
  },
);
