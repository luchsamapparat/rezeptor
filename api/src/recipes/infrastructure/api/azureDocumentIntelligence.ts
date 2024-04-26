import type { FormRecognizerFeature } from '@azure/ai-form-recognizer';
import { AzureKeyCredential, DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import { getFileSize } from '../../../common/util/file';
import { resizeImage } from '../../../common/util/image';
import { sanitizeString } from '../../../common/util/string';

export const createAzureDocumentAnalysisApiClient = (endpoint: string, key: string) => new DocumentAnalysisClient(
  endpoint,
  new AzureKeyCredential(key)
);

type DocumentContents = {
    title: string | null;
    pageNumber: number | null;
    content: string;
};

export async function extractDocumentContents(apiClient: DocumentAnalysisClient, file: File): Promise<DocumentContents> {
  const { content, paragraphs } = await analyzeDocument(apiClient, file);

  const title = paragraphs?.find(({ role }) => role === 'title')?.content ?? null;
  const pageNumber = paragraphs?.filter(({ role, content }) => role === 'pageNumber' && /\d+/.test(content))[0]?.content ?? null;

  return {
    title: (title === null) ? null : sanitizeString(title),
    pageNumber: (pageNumber === null) ? null : parseInt(pageNumber),
    content
  };
}

type Barcode = {
    ean13: string | null;
};

export async function extractBarcode(apiClient: DocumentAnalysisClient, file: File): Promise<Barcode> {
  const result = await analyzeDocument(apiClient, file, ['barcodes']);

  return {
    ean13: result.pages?.[0].barcodes?.find(({ kind }) => kind === 'EAN13')?.value ?? null
  };
}

async function analyzeDocument(apiClient: DocumentAnalysisClient, file: File, features: FormRecognizerFeature[] = []) {
  const document = (getFileSize(file) < 4) ? file : await resizeImage(file, 2048);
  const poller = await apiClient.beginAnalyzeDocument(
    'prebuilt-layout',
    await document.arrayBuffer(),
    { features }
  );
  return poller.pollUntilDone();
}

