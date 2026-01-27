import { WordEntry } from './types';

/**
 * Raw response from an LLM containing word-by-word translation data.
 *
 * This represents the unprocessed output from the LLM before any
 * service-level transformations are applied.
 */
export interface LlmTranslationResponse {
  /** Word-by-word breakdown with grammatical analysis */
  words: WordEntry[];

  /** Alternative translations of the complete sutra (up to 3) */
  alternativeTranslations?: string[];
}

/**
 * Port interface for LLM-based translation operations.
 *
 * This abstracts the LLM interaction, allowing different implementations
 * such as Claude, mock clients for testing, or other LLM providers.
 */
export interface LlmClient {
  /**
   * Sends a Sanskrit sutra to the LLM for word-by-word translation.
   *
   * @param sutra - The Sanskrit sutra in IAST transliteration
   * @returns The raw translation response from the LLM
   */
  translateSutra(sutra: string): Promise<LlmTranslationResponse>;
}
