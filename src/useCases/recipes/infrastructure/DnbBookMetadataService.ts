import { XMLParser } from 'fast-xml-parser';
import { isNull } from 'lodash-es';
import type { Logger } from '../../../application/server/logging';
import { ExternalServiceError, ValidationError } from '../../../common/server/error';
import type { BookMetadata, BookMetadataService } from '../cookbookManagement';

type HttpClient = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type XmlNode = {
  '#text'?: string;
  [key: string]: unknown;
};

const dnbEndpoint = 'https://services.dnb.de/sru/dnb';

const xmlParser = new XMLParser({
  attributeNamePrefix: '',
  ignoreAttributes: false,
  parseTagValue: false,
  removeNSPrefix: true,
  trimValues: true,
});

export class DnbBookMetadataService implements BookMetadataService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly log: Logger,
  ) {}

  async findBook(isbn: string): Promise<BookMetadata | null> {
    const sanitizedIsbn = isbn.replace(/\D/g, '');

    if (sanitizedIsbn.length === 0) {
      this.log.warn({ 'rezeptor.book.isbn': isbn }, 'Invalid ISBN provided');
      throw new ValidationError(`Invalid ISBN "${isbn}".`);
    }

    this.log.debug({ 'rezeptor.book.isbn': sanitizedIsbn }, 'Searching DNB for book by ISBN');

    const url = new URL(dnbEndpoint);
    url.search = new URLSearchParams({
      version: '1.1',
      operation: 'searchRetrieve',
      query: `isbn=${sanitizedIsbn}`,
      recordSchema: 'MARC21-xml',
      maximumRecords: '1',
    }).toString();

    let response: Response;

    try {
      response = await this.httpClient(url, {
        headers: {
          Accept: 'application/xml',
        },
      });
    }
    catch (error) {
      throw new ExternalServiceError('Failed to communicate with DNB API.', error);
    }

    if (!response.ok) {
      throw new ExternalServiceError(
        'Failed to communicate with DNB API.',
        new Error(`DNB API returned HTTP ${response.status}.`),
      );
    }

    try {
      const book = parseBookMetadata(await response.text());

      if (isNull(book)) {
        this.log.debug({ 'rezeptor.book.isbn': sanitizedIsbn }, 'No book found in DNB for ISBN');
        return null;
      }

      this.log.info({ 'rezeptor.book.isbn': sanitizedIsbn, 'rezeptor.book.title': book.title }, 'Book found successfully in DNB');
      return book;
    }
    catch (error) {
      throw new ExternalServiceError('Failed to parse response from DNB API.', error);
    }
  }
}

function parseBookMetadata(xml: string): BookMetadata | null {
  const document = xmlParser.parse(xml) as XmlNode;
  const searchResponse = asNode(document.searchRetrieveResponse);
  const numberOfRecordsValue = text(searchResponse?.numberOfRecords);
  const numberOfRecords = Number(numberOfRecordsValue);

  if (isNull(numberOfRecordsValue) || !Number.isFinite(numberOfRecords)) {
    throw new Error('DNB response does not contain a valid record count.');
  }

  if (numberOfRecords === 0) {
    return null;
  }

  const records = asNode(searchResponse?.records);
  const resultRecord = asNode(asArray(records?.record)[0]);
  const recordData = asNode(resultRecord?.recordData);
  const marcRecord = asNode(recordData?.record);
  const dataFields = asArray(marcRecord?.datafield).map(asNode).filter((field): field is XmlNode => !isNull(field));

  const titleField = dataFields.find(field => field.tag === '245');
  const title = subfieldValues(titleField, 'a')[0];

  if (title === undefined) {
    return null;
  }

  const subtitle = subfieldValues(titleField, 'b')[0];
  const authorFields = dataFields.filter(field => (field.tag === '100' || field.tag === '700') && subfieldValues(field, '4').includes('aut'));
  const authors = authorFields.flatMap(field => subfieldValues(field, 'a')).map(normalizeText);
  const isbns = dataFields
    .filter(field => field.tag === '020')
    .flatMap(field => subfieldValues(field, 'a'))
    .map(value => value.replace(/[^\dX]/gi, '').toUpperCase());

  return {
    title: normalizeText([title, subtitle].filter(value => value !== undefined).join(': ')),
    authors,
    isbn10: isbns.find(value => value.length === 10) ?? null,
    isbn13: isbns.find(value => value.length === 13) ?? null,
  };
}

function subfieldValues(field: XmlNode | null | undefined, code: string): string[] {
  return asArray(field?.subfield)
    .map(asNode)
    .filter((subfield): subfield is XmlNode => !isNull(subfield) && subfield.code === code)
    .map(subfield => text(subfield))
    .filter((value): value is string => value !== null);
}

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function asNode(value: unknown): XmlNode | null {
  return typeof value === 'object' && !isNull(value) ? value as XmlNode : null;
}

function text(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  const node = asNode(value);
  return typeof node?.['#text'] === 'string' ? node['#text'] : null;
}

function normalizeText(value: string): string {
  return value.normalize('NFC').trim();
}
