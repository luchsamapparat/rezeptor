import type { FormRecognizerFeature } from '@azure/ai-form-recognizer';
import { DocumentAnalysisClient as AzureDocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import { getFileSize } from '../../common/server/file';
import { resizeImage } from '../../common/server/image';

type Barcode = {
  ean13: string | null;
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
