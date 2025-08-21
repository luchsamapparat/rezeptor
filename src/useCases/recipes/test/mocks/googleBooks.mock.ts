import { isNull } from 'lodash-es';
import { vi } from 'vitest';
import type { BookMetadata } from '../../cookbookManagement';

export const googleBookVolumesListMockFn = vi.fn();

export const googleBooksMock = {
  volumes: {
    list: googleBookVolumesListMockFn,
  },
};

export function setupGoogleBooksMock(bookData: BookMetadata | null) {
  googleBookVolumesListMockFn.mockResolvedValue({
    data: {
      items: isNull(bookData)
        ? []
        : [{
            volumeInfo: {
              title: bookData.title,
              authors: bookData.authors,
              industryIdentifiers: [
                { type: 'ISBN_10', identifier: bookData.isbn10 },
                { type: 'ISBN_13', identifier: bookData.isbn13 },
              ],
            },
          }],
    },
  });
}
