import { describe, it, expect } from 'vitest';
import { createTestServer } from '../../helpers/test-server';

/**
 * Milestone 2: Confidence Handling
 *
 * Covers:
 * - AC-7: Display high confidence badge (data)
 * - AC-9: Warn on low confidence with actionable guidance
 *
 * Tests verify confidence score data returned from API.
 * UI rendering of badges (green/yellow/orange) tested in UI layer.
 */

interface OcrTranslationResult {
  extractedText: string;
  iastText: string[];
  words: Array<{
    word: string;
    meanings: string[];
  }>;
  alternativeTranslations?: string[];
  ocrConfidence: number;
  ocrWarnings?: string[];
}

interface TranslateSutraFromImageResponse {
  translateSutraFromImage: OcrTranslationResult;
}

describe('Milestone 2: Confidence Handling', () => {
  const server = createTestServer();

  const mutation = `
    mutation TranslateSutraFromImage($image: Upload!) {
      translateSutraFromImage(image: $image) {
        extractedText
        iastText
        words {
          word
          meanings
        }
        alternativeTranslations
        ocrConfidence
        ocrWarnings
      }
    }
  `;

  /**
   * AC-7: Display high confidence badge (data)
   *
   * Given: OCR extraction completed with 96% confidence
   * When: The results page displays
   * Then: I see a high confidence indicator in the response
   * And: The confidence score is 0.96
   * And: No warnings are present
   *
   * Note: UI will render this as green badge "High Confidence (96%)"
   */
  it.skip('should return high confidence data for clear images', async () => {
    // Given: OCR extraction completed with 96% confidence
    const imageFile = {
      filename: 'satyameva-jayate.png',
      mimetype: 'image/png',
      encoding: '7bit',
      _buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    };

    // When: The results page displays
    const response = await server.executeQuery<TranslateSutraFromImageResponse>({
      query: mutation,
      variables: { image: imageFile },
    });

    expect(response.errors).toBeUndefined();
    const result = response.data!.translateSutraFromImage;

    // Then: The confidence score is 0.96 (high confidence)
    expect(result.ocrConfidence).toBe(0.96);

    // No warnings are present
    expect(result.ocrWarnings || undefined).toBeUndefined();

    // UI will use this data to render green "High Confidence (96%)" badge
  });

  /**
   * AC-9: Warn on low confidence with actionable guidance
   *
   * Given: I submitted a blurry photo
   * And: OCR extraction completed with 65% confidence
   * When: The results page displays
   * Then: I see a low confidence indicator
   * And: The confidence score is 0.65
   * And: I see a warning: "Low OCR confidence - please verify extracted text"
   * And: The translation is still provided (user can proceed)
   *
   * Note: UI will render this as orange badge with warning message and
   * two options: "Upload Different Image" | "See Translation Anyway"
   */
  it.skip('should warn when image quality affects accuracy', async () => {
    // Given: I submitted a blurry photo
    const imageFile = {
      filename: 'low-quality-noisy-om.png',
      mimetype: 'image/png',
      encoding: '7bit',
      _buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    };

    // When: The results page displays
    const response = await server.executeQuery<TranslateSutraFromImageResponse>({
      query: mutation,
      variables: { image: imageFile },
    });

    expect(response.errors).toBeUndefined();
    const result = response.data!.translateSutraFromImage;

    // Then: The confidence score is 0.65 (low confidence)
    expect(result.ocrConfidence).toBeLessThan(0.7);
    expect(result.ocrConfidence).toBeGreaterThan(0.1); // Still readable

    // I see a warning message
    expect(result.ocrWarnings).toBeDefined();
    expect(result.ocrWarnings).toHaveLength(1);
    expect(result.ocrWarnings![0]).toContain('Low OCR confidence');

    // The translation is still provided
    expect(result.extractedText).toBe('ॐ');
    expect(result.iastText).toEqual(['oṃ']);
    expect(result.words).toHaveLength(1);

    // UI will show:
    // - Orange badge "Low Confidence (65%)"
    // - Warning: "Image quality may affect accuracy. For better results..."
    // - Two buttons: "Upload Different Image" | "See Translation Anyway"
  });
});
