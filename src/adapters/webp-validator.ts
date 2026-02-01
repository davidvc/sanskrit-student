import { ImageValidator } from '../domain/image-validator';

/**
 * WebP image validator using magic byte detection.
 *
 * Validates WebP format by checking for the RIFF container and WEBP signature.
 */
export class WebpValidator implements ImageValidator {
  private static readonly RIFF_HEADER = [0x52, 0x49, 0x46, 0x46];
  private static readonly WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];
  private static readonly MIN_BUFFER_SIZE = 12;
  private static readonly WEBP_SIGNATURE_OFFSET = 8;

  validate(buffer: Buffer): boolean {
    if (buffer.length < WebpValidator.MIN_BUFFER_SIZE) {
      return false;
    }

    const hasRiffHeader = WebpValidator.RIFF_HEADER.every(
      (byte, index) => buffer[index] === byte
    );

    const hasWebpSignature = WebpValidator.WEBP_SIGNATURE.every(
      (byte, index) => buffer[WebpValidator.WEBP_SIGNATURE_OFFSET + index] === byte
    );

    return hasRiffHeader && hasWebpSignature;
  }
}
