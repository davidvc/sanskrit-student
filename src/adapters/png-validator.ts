import { ImageValidator } from '../domain/image-validator';

/**
 * PNG image validator using magic byte detection.
 *
 * Validates PNG format by checking for the PNG signature.
 */
export class PngValidator implements ImageValidator {
  private static readonly PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
  private static readonly MIN_BUFFER_SIZE = 4;

  validate(buffer: Buffer): boolean {
    if (buffer.length < PngValidator.MIN_BUFFER_SIZE) {
      return false;
    }

    return PngValidator.PNG_SIGNATURE.every((byte, index) => buffer[index] === byte);
  }
}
