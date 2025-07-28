import type { FormRecognizerFeature } from '@azure/ai-form-recognizer';
import { DocumentAnalysisClient as AzureDocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import { getFileSize } from '../../common/server/file';
import { resizeImage } from '../../common/server/image';
import { sanitizeString } from '../../common/server/string';

type Barcode = {
  ean13: string | null;
};

type DocumentContents = {
  title: string | null;
  pageNumber: number | null;
  content: string;
};

export class DocumentAnalysisClient {
  private apiClient: AzureDocumentAnalysisClient;

  constructor(
    endpoint: string,
    key: string,
  ) {
    this.apiClient = new AzureDocumentAnalysisClient(
      endpoint,
      new AzureKeyCredential(key),
    );
  }

  async extractBarcode(file: File): Promise<Barcode> {
    const result = await this.analyzeDocument(file, ['barcodes']);

    return {
      ean13: result.pages?.[0].barcodes?.find(({ kind }) => kind === 'EAN13')?.value ?? null,
    };
  }

  async extractDocumentContents(apiClient: DocumentAnalysisClient, file: File): Promise<DocumentContents> {
    const { content, paragraphs } = await this.analyzeDocument(file);

    const title = paragraphs?.find(({ role }) => role === 'title')?.content ?? null;
    const pageNumber = paragraphs?.filter(({ role, content }) => role === 'pageNumber' && /\d+/.test(content))[0]?.content ?? null;

    return {
      title: (title === null) ? null : sanitizeString(title),
      pageNumber: (pageNumber === null) ? null : parseInt(pageNumber),
      content,
    };
  }

  private async analyzeDocument(file: File, features: FormRecognizerFeature[] = []) {
    const document = (getFileSize(file) < 4) ? file : await resizeImage(file, 2048);
    const poller = await this.apiClient.beginAnalyzeDocument(
      'prebuilt-layout',
      await document.arrayBuffer(),
      { features },
    );
    return poller.pollUntilDone();
  }
}
