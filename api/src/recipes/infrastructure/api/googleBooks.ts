import type { books_v1 } from '@googleapis/books';
import { books } from '@googleapis/books';

type Book = {
    title: string;
    authors: string[];
    isbn10: string | null;
    isbn13: string | null;
};

export const createbooksApi = (key: string) => books({ version: 'v1', key });

export async function findBook(apiClient: books_v1.Books, isbn: string): Promise<Book | null> {
  const sanitizedIsbn = isbn.replace(/\D/g, '');

  if (sanitizedIsbn.length === 0) {
    throw new Error(`Invalid ISBN ${isbn}`);
  }

  const volumes = await apiClient.volumes.list({
    q: `isbn:${sanitizedIsbn}`
  });

  if (
    volumes.data.items?.length === 0 ||
        volumes.data.items === undefined
  ) {
    return null;
  }

  const volumeInfo = volumes.data.items[0].volumeInfo;

  if (
    volumeInfo === undefined ||
        volumeInfo?.title === undefined
  ) {
    return null;
  }

  return {
    title: volumeInfo.title,
    authors: volumeInfo.authors ?? [],
    isbn10: volumeInfo.industryIdentifiers?.find(({ type }) => type === 'ISBN_10')?.identifier ?? null,
    isbn13: volumeInfo.industryIdentifiers?.find(({ type }) => type === 'ISBN_13')?.identifier ?? null
  };

}
