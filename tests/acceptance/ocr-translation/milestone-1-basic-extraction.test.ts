import { describe, it, expect } from 'vitest';
import { createTestServer } from '../../helpers/test-server';

/**
 * Milestone 1: Basic Extraction
 *
 * Covers:
 * - AC-6: Extract Devanagari text with high confidence
 * - AC-10: Convert Devanagari to IAST
 * - AC-18: Reject extremely low confidence
 * - AC-19: Handle multi-line sutras
 *
 * All tests marked with it.skip() except walking skeleton.
 * Enable one at a time for RED-GREEN-REFACTOR cycle.
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

describe('Milestone 1: Basic Extraction', () => {
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
   * AC-6: Extract Devanagari text with high confidence
   *
   * Given: I have submitted a clear photo of Devanagari text
   * When: OCR processing completes
   * Then: The extracted Devanagari text matches the original
   * And: The confidence score is at least 90%
   * And: The extracted text is UTF-8 encoded
   */
  it('should extract Devanagari text with high confidence', async () => {
    // Given: I have a clear photo of Devanagari text
    const imageFile = {
      filename: 'satyameva-jayate.png',
      mimetype: 'image/png',
      encoding: '7bit',
      _buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    };

    // When: OCR processing completes
    const response = await server.executeQuery<TranslateSutraFromImageResponse>({
      query: mutation,
      variables: { image: imageFile },
    });

    // Then: The extracted Devanagari text matches the original
    expect(response.errors).toBeUndefined();
    expect(response.data).toBeDefined();

    const result = response.data!.translateSutraFromImage;

    expect(result.extractedText).toBe('सत्यमेव जयते');

    // The confidence score is at least 90%
    expect(result.ocrConfidence).toBeGreaterThanOrEqual(0.9);

    // The extracted text is UTF-8 encoded (verified by successful parsing)
    expect(Buffer.from(result.extractedText, 'utf-8').toString('utf-8')).toBe(result.extractedText);
  });

  /**
   * AC-10: Convert Devanagari to IAST
   *
   * Given: OCR extracted "सत्यमेव जयते"
   * When: Script normalization completes
   * Then: I see IAST transliteration "satyameva jayate"
   * And: The IAST is displayed in a section labeled "IAST Transliteration"
   * And: The IAST is copy-friendly format
   */
  it.skip('should convert Devanagari to IAST transliteration', async () => {
    // Given: OCR extracted Devanagari text
    const imageFile = {
      filename: 'satyameva-jayate.png',
      mimetype: 'image/png',
      encoding: '7bit',
      _buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    };

    // When: Script normalization completes
    const response = await server.executeQuery<TranslateSutraFromImageResponse>({
      query: mutation,
      variables: { image: imageFile },
    });

    expect(response.errors).toBeUndefined();
    const result = response.data!.translateSutraFromImage;

    // Then: I see IAST transliteration "satyameva jayate"
    expect(result.iastText).toEqual(['satyameva jayate']);

    // The IAST is copy-friendly format (array of strings, one per line)
    expect(Array.isArray(result.iastText)).toBe(true);
    expect(result.iastText[0]).toBe('satyameva jayate');
  });

  /**
   * AC-18: Reject extremely low confidence
   *
   * Given: I submitted a photo with no readable Devanagari text
   * When: OCR processing completes with confidence less than 10%
   * Then: I see an error message "No readable text detected"
   * And: The error suggests retaking with a clearer image
   * And: Processing does not proceed to translation
   */
  it.skip('should reject image with extremely low confidence', async () => {
    // Given: I submitted a photo with no readable Devanagari text
    const imageFile = {
      filename: 'no-devanagari-english-only.png',
      mimetype: 'image/png',
      encoding: '7bit',
      _buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    };

    // When: OCR processing completes with confidence less than 10%
    const response = await server.executeQuery<TranslateSutraFromImageResponse>({
      query: mutation,
      variables: { image: imageFile },
    });

    // Then: I see an error message "No readable text detected"
    expect(response.errors).toBeDefined();
    expect(response.errors).toHaveLength(1);
    expect(response.errors![0].message).toContain('No readable text detected');

    // Processing does not proceed to translation
    expect(response.data).toBeNull();
  });

  /**
   * AC-19: Handle multi-line sutras
   *
   * Given: I photograph a 2-line sutra
   * When: OCR processing completes
   * Then: All lines are extracted
   * And: Line structure is preserved with line breaks
   * And: Confidence score reflects the text complexity
   */
  it.skip('should handle multi-line sutras with preserved structure', async () => {
    // Given: I photograph a 2-line Devanagari sutra
    const imageFile = {
      filename: 'multiline-sloka.png',
      mimetype: 'image/png',
      encoding: '7bit',
      _buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    };

    // When: OCR processing completes
    const response = await server.executeQuery<TranslateSutraFromImageResponse>({
      query: mutation,
      variables: { image: imageFile },
    });

    expect(response.errors).toBeUndefined();
    const result = response.data!.translateSutraFromImage;

    // Then: All lines are extracted
    expect(result.extractedText).toContain('\n');
    expect(result.extractedText).toBe('असतो मा सद्गमय\nतमसो मा ज्योतिर्गमय');

    // Line structure is preserved
    const lines = result.extractedText.split('\n');
    expect(lines).toHaveLength(2);

    // IAST preserves line structure (array with 2 elements)
    expect(result.iastText).toEqual(['asato mā sadgamaya', 'tamaso mā jyotirgamaya']);

    // Confidence score reflects complexity (slightly lower for multi-line)
    expect(result.ocrConfidence).toBeGreaterThanOrEqual(0.85);
  });
});
