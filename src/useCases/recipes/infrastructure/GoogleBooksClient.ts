import { books, type books_v1 } from '@googleapis/books';
import { isEmpty, isUndefined } from 'lodash-es';
import type { BookMetadata, BookMetadataService } from '../cookbookManagement';

type GoogleBooksClientOptions = {
  key: string;
};

export class GoogleBooksClient implements BookMetadataService {
  private apiClient: books_v1.Books;

  constructor(
    { key }: GoogleBooksClientOptions,
  ) {
    this.apiClient = books({ version: 'v1', key });
  }

  async findBook(isbn: string): Promise<BookMetadata | null> {
    const sanitizedIsbn = isbn.replace(/\D/g, '');

    if (sanitizedIsbn.length === 0) {
      throw new Error(`Invalid ISBN ${isbn}`);
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
