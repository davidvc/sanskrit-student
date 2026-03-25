import { describe, it, expect, vi } from 'vitest';
import { GoogleVisionOcrEngine } from '../../src/adapters/google-vision-ocr-engine';
import {
  OcrAuthenticationError,
  OcrRateLimitError,
  OcrServiceUnavailableError,
  OcrInvalidImageError,
  OcrError,
} from '../../src/domain/ocr-errors';

/**
 * Acceptance tests for the Google Cloud Vision OCR adapter.
 *
 * All Vision API calls are stubbed — no real network calls.
 * Tests verify the adapter correctly maps Vision API responses
 * to the OcrEngine domain contract.
 */
describe('Feature: Google Cloud Vision OCR Adapter', () => {
  /**
   * AC1: Extract Devanagari text from a clear image
   *
   * Given: an image buffer containing clear Devanagari text "सत्यमेव जयते"
   * And: the Google Cloud Vision API returns that text with confidence 0.96
   * When: I call extractText with the image buffer
   * Then: the result text should be "सत्यमेव जयते"
   * And: the result confidence should be 0.96
   */
  describe('AC1: Extract Devanagari text from a clear image', () => {
    it('should return text and confidence from Vision API response', async () => {
      // Arrange
      const visionResponse = [
        {
          fullTextAnnotation: {
            text: 'सत्यमेव जयते',
            pages: [{ confidence: 0.96 }],
          },
          textAnnotations: [{ locale: 'sa' }],
        },
      ];

      const stubClient = {
        documentTextDetection: vi.fn().mockResolvedValue(visionResponse),
      };

      const engine = new GoogleVisionOcrEngine({}, stubClient);
      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const result = await engine.extractText(imageBuffer);

      // Assert
      expect(result.text).toBe('सत्यमेव जयते');
      expect(result.confidence).toBe(0.96);
    });
  });

  /**
   * AC7: Authentication failure maps to OcrAuthenticationError
   *
   * Given: the Vision API returns a gRPC UNAUTHENTICATED error (code 16)
   * When: I call extractText with an image buffer
   * Then: the adapter should throw an OcrAuthenticationError
   * And: the error message should indicate a credentials problem
   */
  describe('AC7: Authentication failure', () => {
    it('should throw OcrAuthenticationError for gRPC UNAUTHENTICATED (16)', async () => {
      const authError = Object.assign(new Error('Request had invalid authentication credentials'), { code: 16 });
      const stubClient = { documentTextDetection: vi.fn().mockRejectedValue(authError) };
      const engine = new GoogleVisionOcrEngine({}, stubClient);

      await expect(engine.extractText(Buffer.from('img'))).rejects.toThrow(OcrAuthenticationError);
      await expect(engine.extractText(Buffer.from('img'))).rejects.toThrow(/credentials|authentication/i);
    });

    it('should throw OcrAuthenticationError for gRPC UNKNOWN (2) with credential failure message', async () => {
      const credError = Object.assign(new Error('Getting metadata from plugin failed with error: bad key'), { code: 2 });
      const stubClient = { documentTextDetection: vi.fn().mockRejectedValue(credError) };
      const engine = new GoogleVisionOcrEngine({}, stubClient);

      await expect(engine.extractText(Buffer.from('img'))).rejects.toThrow(OcrAuthenticationError);
    });
  });

  /**
   * AC8: Rate limit maps to OcrRateLimitError
   *
   * Given: the Vision API returns a gRPC RESOURCE_EXHAUSTED error (code 8)
   * When: I call extractText with an image buffer
   * Then: the adapter should throw an OcrRateLimitError
   * And: the error message should indicate that the rate limit was exceeded
   */
  describe('AC8: Rate limit exceeded', () => {
    it('should throw OcrRateLimitError for gRPC RESOURCE_EXHAUSTED (8)', async () => {
      const rateLimitError = Object.assign(new Error('Quota exceeded'), { code: 8 });
      const stubClient = { documentTextDetection: vi.fn().mockRejectedValue(rateLimitError) };
      const engine = new GoogleVisionOcrEngine({}, stubClient);

      await expect(engine.extractText(Buffer.from('img'))).rejects.toThrow(OcrRateLimitError);
      await expect(engine.extractText(Buffer.from('img'))).rejects.toThrow(/rate limit/i);
    });
  });

  /**
   * AC9: Service unavailable maps to OcrServiceUnavailableError
   *
   * Given: the Vision API returns a gRPC UNAVAILABLE error (code 14)
   * When: I call extractText with an image buffer
   * Then: the adapter should throw an OcrServiceUnavailableError
   * And: the error message should indicate that the Vision API is temporarily unavailable
   */
  describe('AC9: Service unavailable', () => {
    it('should throw OcrServiceUnavailableError for gRPC UNAVAILABLE (14)', async () => {
      const unavailableError = Object.assign(new Error('Service unavailable'), { code: 14 });
      const stubClient = { documentTextDetection: vi.fn().mockRejectedValue(unavailableError) };
      const engine = new GoogleVisionOcrEngine({}, stubClient);

      await expect(engine.extractText(Buffer.from('img'))).rejects.toThrow(OcrServiceUnavailableError);
      await expect(engine.extractText(Buffer.from('img'))).rejects.toThrow(/temporarily unavailable/i);
    });
  });

  /**
   * AC10: Invalid image maps to OcrInvalidImageError
   *
   * Given: the Vision API returns a gRPC INVALID_ARGUMENT error (code 3)
   * When: I call extractText with an image buffer
   * Then: the adapter should throw an OcrInvalidImageError
   * And: the error message should describe the rejection reason
   */
  describe('AC10: Invalid image content', () => {
    it('should throw OcrInvalidImageError for gRPC INVALID_ARGUMENT (3)', async () => {
      const invalidImageError = Object.assign(new Error('Bad image encoding'), { code: 3 });
      const stubClient = { documentTextDetection: vi.fn().mockRejectedValue(invalidImageError) };
      const engine = new GoogleVisionOcrEngine({}, stubClient);

      await expect(engine.extractText(Buffer.from('img'))).rejects.toThrow(OcrInvalidImageError);
      await expect(engine.extractText(Buffer.from('img'))).rejects.toThrow(/Bad image encoding/);
    });
  });

  /**
   * AC11: Unexpected error is wrapped as OcrError
   *
   * Given: the Vision API returns an unrecognised error code
   * When: I call extractText with an image buffer
   * Then: the adapter should throw an OcrError
   * And: the original error cause should be preserved
   */
  describe('AC11: Unexpected error fallback', () => {
    it('should throw OcrError with original cause for unrecognised error codes', async () => {
      const unknownError = Object.assign(new Error('Something went wrong'), { code: 999 });
      const stubClient = { documentTextDetection: vi.fn().mockRejectedValue(unknownError) };
      const engine = new GoogleVisionOcrEngine({}, stubClient);

      const thrown = await engine.extractText(Buffer.from('img')).catch((e) => e);
      expect(thrown).toBeInstanceOf(OcrError);
      expect(thrown.cause).toBe(unknownError);
    });
  });
});
