import { describe, it, expect } from 'vitest';
import { createTestServer } from '../helpers/test-server';
import { TRANSLATE_SUTRA_QUERY } from '../helpers/graphql-queries';
import { TranslationResult } from '../../src/domain/types';

/**
 * GraphQL response shape for translateSutra query.
 */
interface TranslateSutraResponse {
  translateSutra: TranslationResult;
}

describe('Feature: Alternative Translations', () => {
  describe('Scenario: Provide alternative sutra translations', () => {
    const server = createTestServer();

    /**
     * Given I have a Sanskrit sutra in IAST transliteration
     * When I submit the sutra for translation
     * Then I should receive up to 3 alternative translations of the complete sutra
     */
    it('should provide alternative translations for the complete sutra', async () => {
      const sutra = 'atha yoganusasanam';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();

      const result = response.data!.translateSutra;

      // Should have alternative translations
      expect(result.alternativeTranslations).toBeDefined();
      expect(Array.isArray(result.alternativeTranslations)).toBe(true);

      // Should have between 1 and 3 alternatives
      expect(result.alternativeTranslations!.length).toBeGreaterThan(0);
      expect(result.alternativeTranslations!.length).toBeLessThanOrEqual(3);

      // Each alternative should be a non-empty string
      result.alternativeTranslations!.forEach(translation => {
        expect(typeof translation).toBe('string');
        expect(translation.length).toBeGreaterThan(0);
      });
    });

    /**
     * And each word should have up to 3 alternative meanings
     */
    it('should provide up to 3 alternative meanings for each word', async () => {
      const sutra = 'atha yoganusasanam';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra },
      });

      const result = response.data!.translateSutra;

      // Each word should have meanings
      expect(result.words.length).toBeGreaterThan(0);

      result.words.forEach(wordEntry => {
        // Should have at least one meaning
        expect(wordEntry.meanings.length).toBeGreaterThan(0);

        // Should have no more than 3 meanings
        expect(wordEntry.meanings.length).toBeLessThanOrEqual(3);

        // Each meaning should be a non-empty string
        wordEntry.meanings.forEach(meaning => {
          expect(typeof meaning).toBe('string');
          expect(meaning.length).toBeGreaterThan(0);
        });
      });
    });

    /**
     * And alternatives should provide different valid translations
     */
    it('should provide distinct alternative translations', async () => {
      const sutra = 'atha yoganusasanam';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra },
      });

      const result = response.data!.translateSutra;

      if (result.alternativeTranslations && result.alternativeTranslations.length > 1) {
        // Check that alternatives are not identical
        const uniqueTranslations = new Set(result.alternativeTranslations);
        expect(uniqueTranslations.size).toBe(result.alternativeTranslations.length);
      }
    });
  });
});
