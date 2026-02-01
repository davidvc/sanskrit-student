/**
 * Port: Image validation interface.
 *
 * Validates image buffers to ensure they are in a supported format.
 */
export interface ImageValidator {
  /**
   * Validate that the buffer contains a valid image in the expected format.
   *
   * @param buffer - Image data buffer to validate
   * @returns true if the buffer contains a valid image, false otherwise
   */
  validate(buffer: Buffer): boolean;
}
