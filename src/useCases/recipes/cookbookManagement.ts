import { isNull } from 'lodash-es';
import type { Identifier } from '../../application/model/identifier';
import { NotFoundError, ValidationError } from '../../common/server/error';

export type CookbookRepository = {
  insert(newCookbook: NewCookbook): Promise<Cookbook>;
  update(cookbookId: Identifier, changes: CookbookChanges): Promise<Cookbook | null>;
  findById(cookbookId: Identifier): Promise<Cookbook | null>;
  getAll(): Promise<Cookbook[]>;
  deleteById(cookbookId: Identifier): Promise<Cookbook | null>;
};

export type BookMetadataService = {
  findBook(isbn: string): Promise<BookMetadata | null>;
};

export type BookMetadata = {
  title: string;
  authors: string[];
  isbn10: string | null;
  isbn13: string | null;
};

export type BarcodeExtractionService = {
  extractBarcode(file: File): Promise<Barcode>;
};

export type Barcode = {
  ean13: string | null;
};

export type Cookbook = {
  id: Identifier;
  title: string;
  authors: string[];
  isbn10: string | null;
  isbn13: string | null;
};

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
  barcodeExtractionService: BarcodeExtractionService;
  bookMetadataService: BookMetadataService;
  backCoverFile: File;
};

export const identifyCookbook = async ({ barcodeExtractionService, bookMetadataService, backCoverFile }: IdentifyCookbookArgs) => {
  const { ean13 } = await barcodeExtractionService.extractBarcode(backCoverFile);

  if (isNull(ean13)) {
    throw new ValidationError('No EAN-13 barcode found in uploaded image.');
  }

  const book = await bookMetadataService.findBook(ean13);

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