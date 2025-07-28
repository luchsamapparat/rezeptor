import { isNull } from 'lodash-es';
import { vi } from 'vitest';

export const documentAnalysisClientBeginAnalyzeDocument = vi.fn();

export const DocumentAnalysisClientMock = {
  beginAnalyzeDocument: documentAnalysisClientBeginAnalyzeDocument,
};

export function setupAzureFormRecognizerMock(ean13Value: string | null) {
  const mockPollUntilDone = vi.fn().mockResolvedValue({
    pages: [{
      barcodes: isNull(ean13Value)
        ? []
        : [{
            kind: 'EAN13',
            value: ean13Value,
          }],
    }],
  });

  const mockPoller = {
    pollUntilDone: mockPollUntilDone,
  };

  documentAnalysisClientBeginAnalyzeDocument.mockResolvedValue(mockPoller);

  return { mockPollUntilDone };
}
