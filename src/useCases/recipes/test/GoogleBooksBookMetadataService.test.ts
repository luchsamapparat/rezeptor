import type { books_v1 } from '@googleapis/books';
import { describe, expect, it, vi } from 'vitest';
import { ExternalServiceError, ValidationError } from '../../../common/server/error';
import { loggerMock } from '../../../tests/mocks/logger.mock';
import { GoogleBooksBookMetadataService } from '../infrastructure/GoogleBooksBookMetadataService';

describe('GoogleBooksBookMetadataService', () => {
  it('should map the first Google Books volume to book metadata', async () => {
    // given:
    const volumesList = vi.fn().mockResolvedValue({
      data: {
        items: [{
          volumeInfo: {
            title: 'Meine Rezepte',
            authors: ['Maria Müller', 'Erika Mustermann'],
            industryIdentifiers: [
              { type: 'ISBN_10', identifier: '3831047634' },
              { type: 'ISBN_13', identifier: '9783831047635' },
            ],
          },
        }],
      },
    });
    const service = createService(volumesList);

    // when:
    const book = await service.findBook('978-3-8310-4763-5');

    // then:
    expect(book).toEqual({
      title: 'Meine Rezepte',
      authors: ['Maria Müller', 'Erika Mustermann'],
      isbn10: '3831047634',
      isbn13: '9783831047635',
    });
    expect(volumesList).toHaveBeenCalledWith({ q: 'isbn:9783831047635' });
  });

  it('should return null when Google Books has no matching volume', async () => {
    // given:
    const volumesList = vi.fn().mockResolvedValue({ data: { items: [] } });
    const service = createService(volumesList);

    // when:
    const book = await service.findBook('9783831047635');

    // then:
    expect(book).toBeNull();
  });

  it('should return null when the matching volume has no title', async () => {
    // given:
    const volumesList = vi.fn().mockResolvedValue({
      data: {
        items: [{ volumeInfo: { authors: ['Maria Müller'] } }],
      },
    });
    const service = createService(volumesList);

    // when:
    const book = await service.findBook('9783831047635');

    // then:
    expect(book).toBeNull();
  });

  it('should reject an empty ISBN without calling Google Books', async () => {
    // given:
    const volumesList = vi.fn();
    const service = createService(volumesList);

    // when/then:
    await expect(service.findBook('---')).rejects.toThrow(ValidationError);
    expect(volumesList).not.toHaveBeenCalled();
  });

  it('should wrap Google Books failures as external service errors', async () => {
    // given:
    const volumesList = vi.fn().mockRejectedValue(new Error('Google Books unavailable.'));
    const service = createService(volumesList);

    // when/then:
    await expect(service.findBook('9783831047635')).rejects.toThrow(ExternalServiceError);
  });
});

function createService(volumesList: ReturnType<typeof vi.fn>) {
  const apiClient = {
    volumes: {
      list: volumesList,
    },
  } as unknown as books_v1.Books;

  return new GoogleBooksBookMetadataService(apiClient, loggerMock);
}
