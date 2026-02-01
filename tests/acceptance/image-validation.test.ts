import { describe, it, expect } from 'vitest';
import { PngValidator } from '../../src/adapters/png-validator';
import { JpegValidator } from '../../src/adapters/jpeg-validator';
import { WebpValidator } from '../../src/adapters/webp-validator';
import { TiffValidator } from '../../src/adapters/tiff-validator';
import { CompositeImageValidator } from '../../src/adapters/composite-image-validator';
import { ImageValidatorFactory } from '../../src/adapters/image-validator-factory';

/**
 * Feature: Image Format Validation
 *
 * Tests cover validation of different image formats using magic byte detection.
 * Each validator implements the Strategy pattern to validate specific image formats.
 */
describe('Feature: Image Format Validation', () => {
  /**
   * AC1: Validate PNG images correctly
   *
   * Given: A buffer containing valid PNG magic bytes
   * When: PngValidator validates the buffer
   * Then: Returns true for valid PNG, false otherwise
   */
  describe('AC1: PNG validation', () => {
    it('should validate valid PNG buffer', () => {
      // Arrange
      const validator = new PngValidator();
      const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

      // Act
      const result = validator.validate(validPngBuffer);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject invalid PNG buffer', () => {
      // Arrange
      const validator = new PngValidator();
      const invalidBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x00]); // Wrong signature

      // Act
      const result = validator.validate(invalidBuffer);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject buffer too short for PNG', () => {
      // Arrange
      const validator = new PngValidator();
      const shortBuffer = Buffer.from([0x89, 0x50]); // Only 2 bytes

      // Act
      const result = validator.validate(shortBuffer);

      // Assert
      expect(result).toBe(false);
    });
  });

  /**
   * AC2: Validate JPEG images correctly
   *
   * Given: A buffer containing valid JPEG magic bytes
   * When: JpegValidator validates the buffer
   * Then: Returns true for valid JPEG, false otherwise
   */
  describe('AC2: JPEG validation', () => {
    it('should validate valid JPEG buffer', () => {
      // Arrange
      const validator = new JpegValidator();
      const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

      // Act
      const result = validator.validate(validJpegBuffer);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject invalid JPEG buffer', () => {
      // Arrange
      const validator = new JpegValidator();
      const invalidBuffer = Buffer.from([0xff, 0xd8, 0x00]); // Wrong signature

      // Act
      const result = validator.validate(invalidBuffer);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject buffer too short for JPEG', () => {
      // Arrange
      const validator = new JpegValidator();
      const shortBuffer = Buffer.from([0xff, 0xd8]); // Only 2 bytes

      // Act
      const result = validator.validate(shortBuffer);

      // Assert
      expect(result).toBe(false);
    });
  });

  /**
   * AC3: Validate WebP images correctly
   *
   * Given: A buffer containing valid WebP magic bytes
   * When: WebpValidator validates the buffer
   * Then: Returns true for valid WebP, false otherwise
   */
  describe('AC3: WebP validation', () => {
    it('should validate valid WebP buffer', () => {
      // Arrange
      const validator = new WebpValidator();
      // RIFF header + file size (4 bytes) + WEBP signature
      const validWebpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // File size placeholder
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);

      // Act
      const result = validator.validate(validWebpBuffer);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject invalid WebP buffer', () => {
      // Arrange
      const validator = new WebpValidator();
      const invalidBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46,
        0x00, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x00, // Wrong WEBP signature
      ]);

      // Act
      const result = validator.validate(invalidBuffer);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject buffer too short for WebP', () => {
      // Arrange
      const validator = new WebpValidator();
      const shortBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46]); // Only RIFF header

      // Act
      const result = validator.validate(shortBuffer);

      // Assert
      expect(result).toBe(false);
    });
  });

  /**
   * AC4: Validate TIFF images correctly
   *
   * Given: A buffer containing valid TIFF magic bytes (little or big endian)
   * When: TiffValidator validates the buffer
   * Then: Returns true for valid TIFF, false otherwise
   */
  describe('AC4: TIFF validation', () => {
    it('should validate valid TIFF buffer (little-endian)', () => {
      // Arrange
      const validator = new TiffValidator();
      const validTiffBuffer = Buffer.from([0x49, 0x49, 0x2a, 0x00]);

      // Act
      const result = validator.validate(validTiffBuffer);

      // Assert
      expect(result).toBe(true);
    });

    it('should validate valid TIFF buffer (big-endian)', () => {
      // Arrange
      const validator = new TiffValidator();
      const validTiffBuffer = Buffer.from([0x4d, 0x4d, 0x00, 0x2a]);

      // Act
      const result = validator.validate(validTiffBuffer);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject invalid TIFF buffer', () => {
      // Arrange
      const validator = new TiffValidator();
      const invalidBuffer = Buffer.from([0x49, 0x49, 0x00, 0x00]); // Wrong signature

      // Act
      const result = validator.validate(invalidBuffer);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject buffer too short for TIFF', () => {
      // Arrange
      const validator = new TiffValidator();
      const shortBuffer = Buffer.from([0x49, 0x49]); // Only 2 bytes

      // Act
      const result = validator.validate(shortBuffer);

      // Assert
      expect(result).toBe(false);
    });
  });

  /**
   * AC5: Composite validator validates multiple formats
   *
   * Given: A composite validator with multiple format validators
   * When: Validating buffers of different formats
   * Then: Returns true for any supported format, false otherwise
   */
  describe('AC5: Composite validation', () => {
    it('should validate PNG through composite validator', () => {
      // Arrange
      const validator = new CompositeImageValidator([
        new PngValidator(),
        new JpegValidator(),
      ]);
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

      // Act
      const result = validator.validate(pngBuffer);

      // Assert
      expect(result).toBe(true);
    });

    it('should validate JPEG through composite validator', () => {
      // Arrange
      const validator = new CompositeImageValidator([
        new PngValidator(),
        new JpegValidator(),
      ]);
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff]);

      // Act
      const result = validator.validate(jpegBuffer);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject unsupported format through composite validator', () => {
      // Arrange
      const validator = new CompositeImageValidator([
        new PngValidator(),
        new JpegValidator(),
      ]);
      const invalidBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);

      // Act
      const result = validator.validate(invalidBuffer);

      // Assert
      expect(result).toBe(false);
    });
  });

  /**
   * AC6: Factory creates correct validator for MIME type
   *
   * Given: A MIME type string
   * When: Creating validator through factory
   * Then: Returns appropriate validator for the MIME type
   */
  describe('AC6: Factory pattern for validator creation', () => {
    it('should create PNG validator for image/png MIME type', () => {
      // Arrange & Act
      const validator = ImageValidatorFactory.createForMimeType('image/png');
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

      // Assert
      expect(validator.validate(pngBuffer)).toBe(true);
    });

    it('should create JPEG validator for image/jpeg MIME type', () => {
      // Arrange & Act
      const validator = ImageValidatorFactory.createForMimeType('image/jpeg');
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff]);

      // Assert
      expect(validator.validate(jpegBuffer)).toBe(true);
    });

    it('should create JPEG validator for image/jpg MIME type', () => {
      // Arrange & Act
      const validator = ImageValidatorFactory.createForMimeType('image/jpg');
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff]);

      // Assert
      expect(validator.validate(jpegBuffer)).toBe(true);
    });

    it('should create WebP validator for image/webp MIME type', () => {
      // Arrange & Act
      const validator = ImageValidatorFactory.createForMimeType('image/webp');
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46,
        0x00, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50,
      ]);

      // Assert
      expect(validator.validate(webpBuffer)).toBe(true);
    });

    it('should create TIFF validator for image/tiff MIME type', () => {
      // Arrange & Act
      const validator = ImageValidatorFactory.createForMimeType('image/tiff');
      const tiffBuffer = Buffer.from([0x49, 0x49, 0x2a, 0x00]);

      // Assert
      expect(validator.validate(tiffBuffer)).toBe(true);
    });

    it('should throw error for unsupported MIME type', () => {
      // Arrange & Act & Assert
      expect(() => {
        ImageValidatorFactory.createForMimeType('image/bmp');
      }).toThrow('Unsupported image format');
    });

    it('should handle case-insensitive MIME types', () => {
      // Arrange & Act
      const validator = ImageValidatorFactory.createForMimeType('IMAGE/PNG');
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

      // Assert
      expect(validator.validate(pngBuffer)).toBe(true);
    });
  });

  /**
   * AC7: Factory creates composite validator with all formats
   *
   * Given: Request for composite validator
   * When: Creating through factory
   * Then: Returns validator supporting all common formats
   */
  describe('AC7: Factory composite validator creation', () => {
    it('should create composite validator supporting all formats', () => {
      // Arrange
      const validator = ImageValidatorFactory.createComposite();

      // Act & Assert - PNG
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      expect(validator.validate(pngBuffer)).toBe(true);

      // Act & Assert - JPEG
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff]);
      expect(validator.validate(jpegBuffer)).toBe(true);

      // Act & Assert - WebP
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46,
        0x00, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50,
      ]);
      expect(validator.validate(webpBuffer)).toBe(true);

      // Act & Assert - TIFF
      const tiffBuffer = Buffer.from([0x49, 0x49, 0x2a, 0x00]);
      expect(validator.validate(tiffBuffer)).toBe(true);

      // Act & Assert - Invalid
      const invalidBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(validator.validate(invalidBuffer)).toBe(false);
    });
  });
});
