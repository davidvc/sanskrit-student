import { ImageValidator } from '../domain/image-validator';

/**
 * TIFF image validator using magic byte detection.
 *
 * Validates TIFF format by checking for little-endian or big-endian TIFF signature.
 */
export class TiffValidator implements ImageValidator {
  private static readonly TIFF_LITTLE_ENDIAN = [0x49, 0x49, 0x2a, 0x00];
  private static readonly TIFF_BIG_ENDIAN = [0x4d, 0x4d, 0x00, 0x2a];
  private static readonly MIN_BUFFER_SIZE = 4;

  validate(buffer: Buffer): boolean {
    if (buffer.length < TiffValidator.MIN_BUFFER_SIZE) {
      return false;
    }

    const isLittleEndian = TiffValidator.TIFF_LITTLE_ENDIAN.every(
      (byte, index) => buffer[index] === byte
    );

    const isBigEndian = TiffValidator.TIFF_BIG_ENDIAN.every(
      (byte, index) => buffer[index] === byte
    );

    return isLittleEndian || isBigEndian;
  }
}
