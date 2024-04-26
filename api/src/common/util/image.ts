import * as sharp from 'sharp';

export async function resizeImage(file: File, width: number) {
  return new File(
    await sharp(await file.arrayBuffer())
      .resize(width)
      .toArray(),
    file.name
  );
}
