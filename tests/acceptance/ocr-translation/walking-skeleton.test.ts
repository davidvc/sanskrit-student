import { describe, it, expect } from 'vitest';
import { createTestServer } from '../../helpers/test-server';

/**
 * Walking Skeleton: OCR Translation Feature
 *
 * AC-6: Extract Devanagari text with high confidence
 *
 * This is the simplest user journey that delivers observable value:
 * User photographs clear Devanagari text → receives translation
 *
 * Why this is the walking skeleton:
 * - User-centric: Starts from user goal (access sacred teachings)
 * - Observable outcome: User can copy translation to notes
 * - End-to-end: Touches all components (upload → OCR → translate)
 * - Demonstrable: Can show to stakeholders
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

describe('Walking Skeleton: User photographs clear Devanagari text and receives translation', () => {
  const server = createTestServer();

  /**
   * Given: I am a spiritual practitioner studying Sanskrit
   * And: I encounter Devanagari text "सत्यमेव जयते" that I cannot read
   * When: I photograph the text and submit for translation
   * Then: I receive IAST transliteration "satyameva jayate"
   * And: I receive word-by-word breakdown with meanings
   * And: I receive primary translation "Truth alone triumphs"
   * And: The OCR confidence is at least 90%
   */
  it('should extract and translate clear Devanagari text from photographed image', async () => {
    // Given: I am studying Sanskrit and encounter Devanagari text I cannot read
    const devanagariText = 'सत्यमेव जयते';
    const imageFile = {
      filename: 'satyameva-jayate.png',
      mimetype: 'image/png',
      encoding: '7bit',
      _buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]), // PNG magic bytes
    };

    // When: I photograph the text and submit for translation
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

    const response = await server.executeQuery<TranslateSutraFromImageResponse>({
      query: mutation,
      variables: { image: imageFile },
    });

    // Then: I receive the extracted Devanagari text
    expect(response.errors).toBeUndefined();
    expect(response.data).toBeDefined();

    const result = response.data!.translateSutraFromImage;

    // The system extracts Devanagari text correctly
    expect(result.extractedText).toBe(devanagariText);

    // The OCR confidence is high (at least 90%)
    expect(result.ocrConfidence).toBeGreaterThanOrEqual(0.9);

    // No warnings for high-quality images
    expect(result.ocrWarnings || undefined).toBeUndefined();

    // I receive IAST transliteration "satyameva jayate"
    expect(result.iastText).toEqual(['satyameva jayate']);

    // I receive word-by-word breakdown
    expect(result.words).toHaveLength(3);

    // Word 1: satyam (truth)
    expect(result.words[0].word).toBe('satyam');
    expect(result.words[0].meanings).toContain('truth');

    // Word 2: eva (indeed, only)
    expect(result.words[1].word).toBe('eva');
    expect(result.words[1].meanings).toContain('indeed');

    // Word 3: jayate (conquers, prevails)
    expect(result.words[2].word).toBe('jayate');
    expect(result.words[2].meanings).toContain('conquers');

    // I receive primary translation
    expect(result.alternativeTranslations).toBeDefined();
    expect(result.alternativeTranslations![0]).toContain('Truth alone');

    // Observable outcome: I can copy the IAST text to my notes app
    // (Clipboard functionality tested in UI layer, data structure verified here)
    expect(result.iastText[0]).toBe('satyameva jayate'); // Copy-friendly format
  });
});
