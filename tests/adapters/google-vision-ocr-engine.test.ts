import { describe, it, expect, vi } from 'vitest';
import { GoogleVisionOcrEngine } from '../../src/adapters/google-vision-ocr-engine';

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
});
