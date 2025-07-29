import { isNull, isUndefined } from 'lodash-es';
import { vi } from 'vitest';

export const documentAnalysisClientBeginAnalyzeDocument = vi.fn();

export const DocumentAnalysisClientMock = {
  beginAnalyzeDocument: documentAnalysisClientBeginAnalyzeDocument,
};

export function setupAzureFormRecognizerMock({
  ean13,
  title,
  pageNumber,
  text,
}: {
  ean13?: string | null;
  title?: string | null;
  pageNumber?: string | null;
  text?: string;
}) {
  // Build response based on what's provided
  const response: Record<string, unknown> = {};

  // If ean13 is provided (including null), add barcode pages
  if (!isUndefined(ean13)) {
    response.pages = [{
      barcodes: isNull(ean13)
        ? []
        : [{
            kind: 'EAN13',
            value: ean13,
          }],
    }];
  }

  // If document content properties are provided, add content and paragraphs
  if ([title, pageNumber, text].some(prop => !isUndefined(prop))) {
    response.content = text;
    response.paragraphs = [
      ...(title ? [{ role: 'title' as const, content: title }] : []),
      ...(pageNumber ? [{ role: 'pageNumber' as const, content: pageNumber }] : []),
      ...(text ? [{ role: 'text' as const, content: text }] : []),
    ];
  }

  const mockPollUntilDone = vi.fn().mockResolvedValue(response);

  documentAnalysisClientBeginAnalyzeDocument.mockResolvedValue({
    pollUntilDone: mockPollUntilDone,
  });

  return { mockPollUntilDone };
}
