import { TranslationResult, TranslationNavigationParams } from '../types/camera.types';

/**
 * Builds navigation params for the translation screen from OCR results
 * @param data - The translation result from the API
 * @returns Navigation params object ready for router.push()
 */
export function buildTranslationParams(data: TranslationResult): TranslationNavigationParams {
  return {
    fromCamera: true,
    ocrConfidence: data.ocrConfidence,
    extractedText: data.extractedText,
    originalText: JSON.stringify(data.originalText),
    iastText: JSON.stringify(data.iastText),
    words: JSON.stringify(data.words),
    alternativeTranslations: JSON.stringify(data.alternativeTranslations),
    ocrWarnings: JSON.stringify(data.ocrWarnings || []),
  };
}
