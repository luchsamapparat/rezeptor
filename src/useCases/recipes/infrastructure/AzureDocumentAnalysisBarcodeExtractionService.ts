import type { FormRecognizerFeature } from '@azure/ai-form-recognizer';
import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import { ATTR_FILE_NAME, ATTR_FILE_SIZE } from '@opentelemetry/semantic-conventions/incubating';
import type { Logger } from '../../../application/server/logging';
import { getFileSize } from '../../../common/server/file';
import { resizeImage } from '../../../common/server/image';
import { sanitizeString } from '../../../common/server/string';
import type { Barcode, BarcodeExtractionService } from '../cookbookManagement';
import type { RecipeContents } from '../recipeManagement';

export class AzureDocumentAnalysisBarcodeExtractionService implements BarcodeExtractionService {
  constructor(
    private apiClient: DocumentAnalysisClient,
    private readonly log: Logger,
  ) { }

  async extractBarcode(file: File): Promise<Barcode> {
    this.log.debug({
      [ATTR_FILE_NAME]: file.name,
    }, 'Extracting barcode from file');
    const result = await this.analyzeDocument(file, ['barcodes']);

    const ean13 = result.pages?.[0].barcodes?.find(({ kind }) => kind === 'EAN13')?.value ?? null;

    if (ean13) {
      this.log.info({
        [ATTR_FILE_NAME]: file.name,
        'rezeptor.barcode.value': ean13,
      }, 'Barcode extracted successfully');
    }
    else {
      this.log.debug({
        [ATTR_FILE_NAME]: file.name,
      }, 'No EAN13 barcode found');
    }

    return { ean13 };
  }

  async extractRecipeContents(file: File): Promise<RecipeContents> {
    this.log.debug({
      [ATTR_FILE_NAME]: file.name,
    }, 'Extracting recipe contents from file');
    const { content, paragraphs } = await this.analyzeDocument(file);

    const title = paragraphs?.find(({ role }) => role === 'title')?.content ?? null;
    const pageNumber = paragraphs?.filter(({ role, content }) => role === 'pageNumber' && /\d+/.test(content))[0]?.content ?? null;

    this.log.info({
      [ATTR_FILE_NAME]: file.name,
      'rezeptor.recipe.title': title,
      'rezeptor.recipe.page': pageNumber,
    }, 'Recipe contents extracted successfully');

    return {
      title: (title === null) ? null : sanitizeString(title),
      pageNumber: (pageNumber === null) ? null : parseInt(pageNumber),
      instructions: content,
      ingredients: [],
    };
  }

  private async analyzeDocument(file: File, features: FormRecognizerFeature[] = []) {
    const fileSize = getFileSize(file);
    this.log.debug({
      [ATTR_FILE_NAME]: file.name,
      [ATTR_FILE_SIZE]: fileSize,
    }, 'Starting document analysis');

    const document = fileSize < 4 ? file : await resizeImage(file, 2048);
    const poller = await this.apiClient.beginAnalyzeDocument(
      'prebuilt-layout',
      await document.arrayBuffer(),
      { features },
    );
    return poller.pollUntilDone();
  }
}
