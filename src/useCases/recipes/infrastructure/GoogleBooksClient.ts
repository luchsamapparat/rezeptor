import { type books_v1 } from '@googleapis/books';
import { isEmpty, isUndefined } from 'lodash-es';
import { ValidationError } from '../../../common/server/error';
import type { BookMetadata, BookMetadataService } from '../cookbookManagement';

export class GoogleBooksClient implements BookMetadataService {
  constructor(
    private apiClient: books_v1.Books,
  ) {
  }

  async findBook(isbn: string): Promise<BookMetadata | null> {
    const sanitizedIsbn = isbn.replace(/\D/g, '');

    if (sanitizedIsbn.length === 0) {
      throw new ValidationError(`Invalid ISBN "${isbn}".`);
    }

    const volumes = await this.apiClient.volumes.list({
      q: `isbn:${sanitizedIsbn}`,
    });

    if (isEmpty(volumes.data.items)) {
      return null;
    }

    const volumeInfo = volumes.data.items?.[0].volumeInfo ?? undefined;

    if (isUndefined(volumeInfo) || isUndefined(volumeInfo?.title)) {
      return null;
    }

    return {
      title: volumeInfo.title,
      authors: volumeInfo.authors ?? [],
      isbn10: volumeInfo.industryIdentifiers?.find(({ type }) => type === 'ISBN_10')?.identifier ?? null,
      isbn13: volumeInfo.industryIdentifiers?.find(({ type }) => type === 'ISBN_13')?.identifier ?? null,
    };
  }
}
