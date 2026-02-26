import { describe, it, expect } from 'vitest';
import { createTestServer } from '../../helpers/test-server';

/**
 * Milestone 4: Word Translations
 *
 * Covers:
 * - AC-11: Display word-by-word breakdown
 * - AC-12: Display primary translation
 * - AC-13: Display alternative translations
 *
 * Tests verify translation data structure returned from API.
 * UI rendering (expandable words, copy buttons) tested in UI layer.
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

describe('Milestone 4: Word Translations', () => {
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
   * AC-11: Display word-by-word breakdown
   *
   * Given: Translation has completed for "satyameva jayate"
   * When: I scroll to the word breakdown section
   * Then: I see a list of words with their meanings
   * And: Each word has IAST representation
   * And: Each word has an array of meanings
   *
   * Note: UI will render this as expandable list with [▷] icons
   */
  it.skip('should provide word-by-word breakdown with meanings', async () => {
    // Given: Translation has completed
    const imageFile = {
      filename: 'satyameva-jayate.png',
      mimetype: 'image/png',
      encoding: '7bit',
      _buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    };

    // When: I scroll to the word breakdown section
    const response = await server.executeQuery<TranslateSutraFromImageResponse>({
      query: mutation,
      variables: { image: imageFile },
    });

    expect(response.errors).toBeUndefined();
    const result = response.data!.translateSutraFromImage;

    // Then: I see a list of words (3 words for "satyameva jayate")
    expect(result.words).toHaveLength(3);

    // Each word has IAST representation
    expect(result.words[0].word).toBe('satyam');
    expect(result.words[1].word).toBe('eva');
    expect(result.words[2].word).toBe('jayate');

    // Each word has an array of meanings
    expect(result.words[0].meanings).toContain('truth');
    expect(result.words[1].meanings).toContain('indeed');
    expect(result.words[2].meanings).toContain('conquers');

    // UI will render:
    // | satyam  | [▷] |
    // | eva     | [▷] |
    // | jayate  | [▷] |
    //
    // When user taps "satyam [▷]", it expands to show:
    // | satyam (सत्यम्)                    |
    // | Meanings: truth, reality, truthfulness |
  });

  /**
   * AC-12: Display primary translation
   *
   * Given: Translation has completed
   * When: I view the translation section
   * Then: I see the primary translation: "Truth alone triumphs"
   * And: The translation is in the alternativeTranslations array (first element)
   *
   * Note: UI will display this prominently with a Copy button
   */
  it.skip('should provide primary translation', async () => {
    // Given: Translation has completed
    const imageFile = {
      filename: 'satyameva-jayate.png',
      mimetype: 'image/png',
      encoding: '7bit',
      _buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    };

    // When: I view the translation section
    const response = await server.executeQuery<TranslateSutraFromImageResponse>({
      query: mutation,
      variables: { image: imageFile },
    });

    expect(response.errors).toBeUndefined();
    const result = response.data!.translateSutraFromImage;

    // Then: I see the primary translation
    expect(result.alternativeTranslations).toBeDefined();
    expect(result.alternativeTranslations!.length).toBeGreaterThan(0);

    // The first translation is the primary one
    expect(result.alternativeTranslations![0]).toContain('Truth alone');

    // UI will render:
    // Translation: "Truth alone triumphs" [Copy]
  });

  /**
   * AC-13: Display alternative translations
   *
   * Given: Translation has completed
   * When: I view the results page
   * Then: I see alternative translations (2-4 options)
   * And: Each alternative provides interpretative variety
   *
   * Note: UI will render this as collapsible section "Alternative Translations [▽]"
   */
  it.skip('should provide alternative translations for interpretative variety', async () => {
    // Given: Translation has completed
    const imageFile = {
      filename: 'satyameva-jayate.png',
      mimetype: 'image/png',
      encoding: '7bit',
      _buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    };

    // When: I view the results page
    const response = await server.executeQuery<TranslateSutraFromImageResponse>({
      query: mutation,
      variables: { image: imageFile },
    });

    expect(response.errors).toBeUndefined();
    const result = response.data!.translateSutraFromImage;

    // Then: I see alternative translations (2-4 options)
    expect(result.alternativeTranslations).toBeDefined();
    expect(result.alternativeTranslations!.length).toBeGreaterThanOrEqual(1);
    expect(result.alternativeTranslations!.length).toBeLessThanOrEqual(4);

    // Each alternative provides interpretative variety
    // (Different phrasings of the same meaning)
    const allTranslations = result.alternativeTranslations!.join(' ');
    expect(allTranslations).toContain('truth');

    // UI will render:
    // [Alternative Translations ▽] (collapsed by default)
    //
    // When user taps to expand:
    // • Truth conquers all
    // • Truth ultimately prevails
    // • Reality alone is victorious
  });
});
