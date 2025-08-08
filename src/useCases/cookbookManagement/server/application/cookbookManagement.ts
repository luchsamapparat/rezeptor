import { isNull } from 'lodash-es';
import type { Identifier } from '../../../../application/model/identifier';
import type { DocumentAnalysisClient } from '../../../../application/server/external/DocumentAnalysisClient';
import { NotFoundError, ValidationError } from '../../../../common/server/error';
import type { BookSearchClient } from '../external/BookSearchClient';
import type { CookbookRepository } from '../persistence/cookbookRepository';

type NewCookbook = {
  title: string;
  authors: string[];
  isbn10: string | null;
  isbn13: string | null;
};

type AddCookbookArgs = {
  cookbookRepository: CookbookRepository;
  cookbook: NewCookbook;
};

export const addCookbook = async ({ cookbookRepository, cookbook }: AddCookbookArgs) => cookbookRepository.insert(cookbook);

type CookbookChanges = {
  title?: string;
  authors?: string[];
  isbn10?: string | null;
  isbn13?: string | null;
};

type EditCookbookArgs = {
  cookbookRepository: CookbookRepository;
  cookbookId: Identifier;
  cookbookChanges: CookbookChanges;
};

export const editCookbook = async ({ cookbookRepository, cookbookId, cookbookChanges }: EditCookbookArgs) => {
  const cookbook = await cookbookRepository.update(cookbookId, cookbookChanges);

  if (isNull(cookbook)) {
    throw new NotFoundError(`No cookbook with ID ${cookbookId} not found`);
  }

  return cookbook;
};

type GetCookbookArgs = {
  cookbookRepository: CookbookRepository;
  cookbookId: Identifier;
};

export const getCookbook = async ({ cookbookRepository, cookbookId }: GetCookbookArgs) => cookbookRepository.findById(cookbookId);

type GetCookbooksArgs = {
  cookbookRepository: CookbookRepository;
};

export const getCookbooks = async ({ cookbookRepository }: GetCookbooksArgs) => cookbookRepository.getAll();

type IdentifyCookbookArgs = {
  documentAnalysisClient: DocumentAnalysisClient;
  bookSearchClient: BookSearchClient;
  backCoverFile: File;
};

export const identifyCookbook = async ({ documentAnalysisClient, bookSearchClient, backCoverFile }: IdentifyCookbookArgs) => {
  const { ean13 } = await documentAnalysisClient.extractBarcode(backCoverFile);

  if (isNull(ean13)) {
    throw new ValidationError('No EAN-13 barcode found in uploaded image.');
  }

  const book = await bookSearchClient.findBook(ean13);

  if (isNull(book)) {
    throw new NotFoundError(`No book found for the extracted EAN-13 barcode ${ean13}.`);
  }

  return book;
};

type RemoveCookbookArgs = {
  cookbookRepository: CookbookRepository;
  cookbookId: Identifier;
};

export const removeCookbook = async ({ cookbookRepository, cookbookId }: RemoveCookbookArgs) => {
  const cookbook = await cookbookRepository.deleteById(cookbookId);

  if (isNull(cookbook)) {
    throw new NotFoundError(`No cookbook with ID ${cookbookId} found`);
  }
};