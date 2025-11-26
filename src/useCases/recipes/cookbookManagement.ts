import { isNull } from 'lodash-es';
import type { Identifier } from '../../application/model/identifier';
import { NotFoundError, ValidationError } from '../../common/server/error';

/**
 * Repository interface for cookbook persistence operations.
 * Provides CRUD operations for cookbook entities.
 */
export type CookbookRepository = {
  insert(newCookbook: NewCookbook): Promise<Cookbook>;
  update(cookbookId: Identifier, changes: CookbookChanges): Promise<Cookbook | null>;
  findById(cookbookId: Identifier): Promise<Cookbook | null>;
  getAll(): Promise<Cookbook[]>;
  delete(cookbookId: Identifier): Promise<Cookbook | null>;
};

/**
 * Service interface for retrieving book metadata from external sources.
 * Used to fetch book information by ISBN.
 */
export type BookMetadataService = {
  findBook(isbn: string): Promise<BookMetadata | null>;
};

/**
 * Metadata information for a book retrieved from external sources.
 * Contains bibliographic information including title, authors, and ISBN numbers.
 */
export type BookMetadata = {
  title: string;
  authors: string[];
  isbn10: string | null;
  isbn13: string | null;
};

/**
 * Service interface for extracting barcodes from images.
 * Uses OCR to detect and extract EAN-13 barcodes from cookbook covers.
 */
export type BarcodeExtractionService = {
  extractBarcode(file: File): Promise<Barcode>;
};

/**
 * Result of barcode extraction containing the EAN-13 code.
 */
export type Barcode = {
  ean13: string | null;
};

/**
 * Represents a cookbook entity with complete metadata.
 * Includes unique identifier and bibliographic information.
 */
export type Cookbook = {
  id: Identifier;
  title: string;
  authors: CookbookAuthor[];
  isbn10: string | null;
  isbn13: string | null;
};

export type NewCookbook = {
  title: string;
  authors: CookbookAuthor[];
  isbn10: string | null;
  isbn13: string | null;
};

type AddCookbookArgs = {
  cookbookRepository: CookbookRepository;
  cookbook: NewCookbook;
};

export type CookbookAuthor = {
  name: string;
};

/**
 * Adds a new cookbook to the repository.
 *
 * @param args - Arguments containing the repository and cookbook data
 * @param args.cookbookRepository - Repository to persist the cookbook
 * @param args.cookbook - New cookbook data to be inserted
 * @returns Promise resolving to the created cookbook with generated ID
 */
export const addCookbook = async ({ cookbookRepository, cookbook }: AddCookbookArgs) => cookbookRepository.insert(cookbook);

export type CookbookChanges = {
  title?: string;
  authors?: CookbookAuthor[];
  isbn10?: string | null;
  isbn13?: string | null;
};

type EditCookbookArgs = {
  cookbookRepository: CookbookRepository;
  cookbookId: Identifier;
  cookbookChanges: CookbookChanges;
};

/**
 * Updates an existing cookbook with the provided changes.
 *
 * @param args - Arguments containing the repository, cookbook ID, and changes
 * @param args.cookbookRepository - Repository to persist the changes
 * @param args.cookbookId - Unique identifier of the cookbook to update
 * @param args.cookbookChanges - Partial cookbook data to update
 * @returns Promise resolving to the updated cookbook
 * @throws {NotFoundError} When no cookbook with the given ID exists
 */
export const editCookbook = async ({ cookbookRepository, cookbookId, cookbookChanges }: EditCookbookArgs) => {
  const cookbook = await cookbookRepository.update(cookbookId, cookbookChanges);

  if (isNull(cookbook)) {
    throw new NotFoundError(`No cookbook with ID ${cookbookId} not found.`);
  }

  return cookbook;
};

type GetCookbookArgs = {
  cookbookRepository: CookbookRepository;
  cookbookId: Identifier;
};

/**
 * Retrieves a single cookbook by its unique identifier.
 *
 * @param args - Arguments containing the repository and cookbook ID
 * @param args.cookbookRepository - Repository to query
 * @param args.cookbookId - Unique identifier of the cookbook to retrieve
 * @returns Promise resolving to the cookbook or null if not found
 */
export const getCookbook = async ({ cookbookRepository, cookbookId }: GetCookbookArgs) => cookbookRepository.findById(cookbookId);

type GetCookbooksArgs = {
  cookbookRepository: CookbookRepository;
};

/**
 * Retrieves all cookbooks from the repository.
 *
 * @param args - Arguments containing the repository
 * @param args.cookbookRepository - Repository to query
 * @returns Promise resolving to an array of all cookbooks
 */
export const getCookbooks = async ({ cookbookRepository }: GetCookbooksArgs) => cookbookRepository.getAll();

type IdentifyCookbookArgs = {
  barcodeExtractionService: BarcodeExtractionService;
  bookMetadataService: BookMetadataService;
  backCoverFile: File;
};

/**
 * Identifies a cookbook by extracting its EAN-13 barcode from a back cover image
 * and retrieving metadata from an external book service.
 *
 * @param args - Arguments containing services and the back cover file
 * @param args.barcodeExtractionService - Service to extract barcode from image
 * @param args.bookMetadataService - Service to retrieve book metadata
 * @param args.backCoverFile - Image file containing the cookbook's back cover
 * @returns Promise resolving to the book metadata
 * @throws {ValidationError} When no EAN-13 barcode is found in the image
 * @throws {NotFoundError} When no book metadata is found for the extracted barcode
 */
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

/**
 * Removes a cookbook from the repository by its unique identifier.
 *
 * @param args - Arguments containing the repository and cookbook ID
 * @param args.cookbookRepository - Repository to perform deletion
 * @param args.cookbookId - Unique identifier of the cookbook to remove
 * @returns Promise that resolves when the cookbook is deleted
 */
export const removeCookbook = async ({ cookbookRepository, cookbookId }: RemoveCookbookArgs) => {
  const cookbook = await cookbookRepository.delete(cookbookId);

  if (isNull(cookbook)) {
    throw new NotFoundError(`No cookbook with ID ${cookbookId} found.`);
  }
};