export type ProgressState = 'idle' | 'uploading' | 'ocr' | 'translating' | 'complete';

export interface CapturedPhoto {
  uri: string;
  width?: number;
  height?: number;
}

export interface TranslationResult {
  ocrConfidence: number;
  extractedText: string;
  originalText: string[];
  iastText: string[];
  words: Array<{ word: string; meanings: string[] }>;
  alternativeTranslations: string[];
  ocrWarnings?: string[];
}

export interface TranslationNavigationParams {
  fromCamera: boolean;
  ocrConfidence: number;
  extractedText: string;
  originalText: string;
  iastText: string;
  words: string;
  alternativeTranslations: string;
  ocrWarnings: string;
}
