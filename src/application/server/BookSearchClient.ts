import { books, type books_v1 } from '@googleapis/books';
import { isEmpty, isUndefined } from 'lodash-es';

export type BookSearchResult = {
  title: string;
  authors: string[];
  isbn10: string | null;
  isbn13: string | null;
};

export class BookSearchClient {
  private apiClient: books_v1.Books;

  constructor(
    key: string,
  ) {
    this.apiClient = books({ version: 'v1', key });
  }

  async findBook(isbn: string): Promise<BookSearchResult | null> {
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
