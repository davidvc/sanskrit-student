import Sanscript from '@indic-transliteration/sanscript';
import { ScriptConverter } from '../domain/script-converter';

/**
 * Sanscript-powered implementation of the ScriptConverter interface.
 *
 * This adapter uses the @indic-transliteration/sanscript library to convert
 * Devanagari script to IAST (International Alphabet of Sanskrit Transliteration).
 */
export class SanscriptConverter implements ScriptConverter {
  /**
   * Converts Devanagari script text to IAST.
   *
   * Uses the Sanscript library's transliteration function to perform
   * the conversion from 'devanagari' scheme to 'iast' scheme.
   *
   * @param devanagari - Text in Devanagari script
   * @returns The text transliterated to IAST
   */
  toIast(devanagari: string): string {
    return Sanscript.t(devanagari, 'devanagari', 'iast');
  }
}
