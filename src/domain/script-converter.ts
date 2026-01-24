/**
 * Port interface for script conversion operations.
 *
 * This abstracts the transliteration logic, allowing different implementations
 * for converting between Sanskrit writing systems (e.g., Devanagari to IAST).
 */
export interface ScriptConverter {
  /**
   * Converts Devanagari script text to IAST (International Alphabet of
   * Sanskrit Transliteration).
   *
   * @param devanagari - Text in Devanagari script
   * @returns The text transliterated to IAST
   */
  toIast(devanagari: string): string;
}
