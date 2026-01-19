import { LlmClient, LlmTranslationResponse } from '../domain/llm-client';
import { WordEntry } from '../domain/types';

/**
 * Stubbed response data for known Sanskrit sutras.
 * Used for testing without external LLM dependencies.
 */
const STUBBED_RESPONSES: Record<string, WordEntry[]> = {
  'atha yoganuasanam': [
    {
      word: 'atha',
      meanings: ['now', 'here begins', 'auspicious beginning'],
    },
    {
      word: 'yoganuasanam',
      meanings: [
        'instruction on yoga',
        'teaching of yoga',
        'discipline of yoga',
      ],
    },
  ],
};

/**
 * Default response for unknown sutras.
 * Provides a valid structure for any input text.
 */
const DEFAULT_RESPONSE: WordEntry[] = [
  {
    word: 'unknown',
    meanings: ['word not in stubbed data'],
  },
];

/**
 * Mock implementation of LlmClient for testing purposes.
 *
 * Returns stubbed responses for known test sutras and a generic
 * valid response for unknown input. This allows acceptance tests
 * to run without external LLM dependencies.
 */
export class MockLlmClient implements LlmClient {
  /**
   * Translates a Sanskrit sutra using stubbed data.
   *
   * @param sutra - The Sanskrit sutra in IAST transliteration
   * @returns Stubbed translation response for known sutras,
   *          or a generic valid response for unknown input
   */
  async translateSutra(sutra: string): Promise<LlmTranslationResponse> {
    const normalizedSutra = this.normalizeSutra(sutra);
    const words = STUBBED_RESPONSES[normalizedSutra] ?? DEFAULT_RESPONSE;

    return { words };
  }

  /**
   * Normalizes sutra text for lookup in stubbed responses.
   * Converts special characters to ASCII equivalents for matching.
   */
  private normalizeSutra(sutra: string): string {
    return sutra
      .toLowerCase()
      .trim()
      .replace(/a/g, 'a')
      .replace(/s/g, 's');
  }
}
