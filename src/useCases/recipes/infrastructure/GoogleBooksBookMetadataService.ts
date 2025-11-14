import { type books_v1 } from '@googleapis/books';
import { isEmpty, isUndefined } from 'lodash-es';
import type { Logger } from '../../../application/server/logging';
import { ValidationError } from '../../../common/server/error';
import type { BookMetadata, BookMetadataService } from '../cookbookManagement';

export class GoogleBooksBookMetadataService implements BookMetadataService {
  constructor(
    private apiClient: books_v1.Books,
    private readonly log: Logger,
  ) {}

  async findBook(isbn: string): Promise<BookMetadata | null> {
    const sanitizedIsbn = isbn.replace(/\D/g, '');

    if (sanitizedIsbn.length === 0) {
      this.log.warn({ 'rezeptor.book.isbn': isbn }, 'Invalid ISBN provided');
      throw new ValidationError(`Invalid ISBN "${isbn}".`);
    }
    this.log.debug({ 'rezeptor.book.isbn': sanitizedIsbn }, 'Searching for book by ISBN');

    const volumes = await this.apiClient.volumes.list({
      q: `isbn:${sanitizedIsbn}`,
    });

    if (isEmpty(volumes.data.items)) {
      this.log.debug({ 'rezeptor.book.isbn': sanitizedIsbn }, 'No book found for ISBN');
      return null;
    }

    const volumeInfo = volumes.data.items?.[0].volumeInfo ?? undefined;

    if (isUndefined(volumeInfo) || isUndefined(volumeInfo?.title)) {
      this.log.debug({ 'rezeptor.book.isbn': sanitizedIsbn }, 'Book found but volume info incomplete');
      return null;
    }
    this.log.info({ 'rezeptor.book.isbn': sanitizedIsbn, 'rezeptor.book.title': volumeInfo.title }, 'Book found successfully');

    return {
      title: volumeInfo.title,
      authors: volumeInfo.authors ?? [],
      isbn10: volumeInfo.industryIdentifiers?.find(({ type }) => type === 'ISBN_10')?.identifier ?? null,
      isbn13: volumeInfo.industryIdentifiers?.find(({ type }) => type === 'ISBN_13')?.identifier ?? null,
    };
  }
}
