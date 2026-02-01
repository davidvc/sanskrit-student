import { ImageValidator } from '../domain/image-validator';
import { PngValidator } from './png-validator';
import { JpegValidator } from './jpeg-validator';
import { WebpValidator } from './webp-validator';
import { TiffValidator } from './tiff-validator';
import { CompositeImageValidator } from './composite-image-validator';

/**
 * Factory for creating image validators.
 *
 * Provides factory methods to create validators for specific formats
 * or a composite validator that supports all common image formats.
 */
export class ImageValidatorFactory {
  /**
   * Create a validator for a specific MIME type.
   *
   * @param mimeType - Image MIME type
   * @returns ImageValidator instance for the specified type
   * @throws Error if MIME type is not supported
   */
  static createForMimeType(mimeType: string): ImageValidator {
    const normalizedType = mimeType.toLowerCase();

    switch (normalizedType) {
      case 'image/png':
        return new PngValidator();
      case 'image/jpeg':
      case 'image/jpg':
        return new JpegValidator();
      case 'image/webp':
        return new WebpValidator();
      case 'image/tiff':
        return new TiffValidator();
      default:
        throw new Error(
          `Unsupported image format: ${mimeType}. Supported formats: PNG, JPG, JPEG, WEBP, TIFF`
        );
    }
  }

  /**
   * Create a composite validator that supports all common image formats.
   *
   * @returns CompositeImageValidator instance supporting PNG, JPEG, WebP, and TIFF
   */
  static createComposite(): ImageValidator {
    return new CompositeImageValidator([
      new PngValidator(),
      new JpegValidator(),
      new WebpValidator(),
      new TiffValidator(),
    ]);
  }
}
