import { ImageValidator } from '../domain/image-validator';

/**
 * JPEG image validator using magic byte detection.
 *
 * Validates JPEG format by checking for the JPEG SOI marker.
 */
export class JpegValidator implements ImageValidator {
  private static readonly JPEG_SOI = [0xff, 0xd8, 0xff];
  private static readonly MIN_BUFFER_SIZE = 3;

  validate(buffer: Buffer): boolean {
    if (buffer.length < JpegValidator.MIN_BUFFER_SIZE) {
      return false;
    }

    return JpegValidator.JPEG_SOI.every((byte, index) => buffer[index] === byte);
  }
}
