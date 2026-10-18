import sharp from 'sharp';
import type { FileRepository } from '../../../common/persistence/FileRepository';
import type { RecipePhotoFileRepository as IRecipePhotoFileRepository, RecipePhotoVariant } from '../recipeManagement';

const previewWidth = 64;
const displayWidth = 1600;
const variantGeneration = new Map<string, Promise<void>>();

const variantFilename = (filename: string, variant: RecipePhotoVariant) => `${filename}.${variant}.webp`;

export class RecipePhotoFileRepository implements IRecipePhotoFileRepository {
  constructor(private files: FileRepository) { }

  async save(file: File): Promise<string> {
    const filename = await this.files.save(file);
    try {
      await this.ensureVariants(filename);
      return filename;
    }
    catch (error) {
      await this.remove(filename);
      throw error;
    }
  }

  async get(filename: string, variant: RecipePhotoVariant): Promise<ReadableStream<Uint8Array>> {
    await this.ensureVariants(filename);
    return await this.files.get(variantFilename(filename, variant));
  }

  async remove(filename: string): Promise<void> {
    await Promise.all([
      this.files.remove(filename),
      this.files.remove(variantFilename(filename, 'preview')),
      this.files.remove(variantFilename(filename, 'display')),
    ]);
  }

  private async ensureVariants(filename: string): Promise<void> {
    if (await this.variantsExist(filename)) return;

    const pendingGeneration = variantGeneration.get(filename);
    if (pendingGeneration) return await pendingGeneration;

    const generation = this.generateMissingVariants(filename);
    variantGeneration.set(filename, generation);
    try {
      await generation;
    }
    finally {
      variantGeneration.delete(filename);
    }
  }

  private async variantsExist(filename: string): Promise<boolean> {
    const [previewExists, displayExists] = await Promise.all([
      this.files.exists(variantFilename(filename, 'preview')),
      this.files.exists(variantFilename(filename, 'display')),
    ]);
    return previewExists && displayExists;
  }

  private async generateMissingVariants(filename: string): Promise<void> {
    const previewFilename = variantFilename(filename, 'preview');
    const displayFilename = variantFilename(filename, 'display');
    const [previewExists, displayExists] = await Promise.all([
      this.files.exists(previewFilename),
      this.files.exists(displayFilename),
    ]);
    if (previewExists && displayExists) return;

    const original = Buffer.from(await new Response(await this.files.get(filename)).arrayBuffer());
    const variants = await Promise.all([
      previewExists
        ? undefined
        : sharp(original)
            .rotate()
            .resize({ width: previewWidth, height: previewWidth, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 35 })
            .toBuffer(),
      displayExists
        ? undefined
        : sharp(original)
            .rotate()
            .resize({ width: displayWidth, height: displayWidth, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer(),
    ]);

    const [preview, display] = variants;
    await Promise.all([
      preview && this.files.saveAs(previewFilename, new File([new Uint8Array(preview)], previewFilename, { type: 'image/webp' })),
      display && this.files.saveAs(displayFilename, new File([new Uint8Array(display)], displayFilename, { type: 'image/webp' })),
    ]);
  }
}
