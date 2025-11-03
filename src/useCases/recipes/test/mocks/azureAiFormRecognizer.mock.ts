import { isNull } from 'lodash-es';
import { vi } from 'vitest';

export const documentAnalysisClientMock = {
  beginAnalyzeDocument: vi.fn(),
};

export function setupAzureFormRecognizerMock({
  ean13,
}: {
  ean13: string | null;
}) {
  // Build response based on what's provided
  const response: Record<string, unknown> = {};

  response.pages = [{
    barcodes: isNull(ean13)
      ? []
      : [{
          kind: 'EAN13',
          value: ean13,
        }],
  }];

  const mockPollUntilDone = vi.fn().mockResolvedValue(response);

  documentAnalysisClientMock.beginAnalyzeDocument.mockResolvedValue({
    pollUntilDone: mockPollUntilDone,
  });

  return { mockPollUntilDone };
}
