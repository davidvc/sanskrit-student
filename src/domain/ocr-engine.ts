/**
 * Result from OCR text extraction.
 */
export interface OcrResult {
  /** Extracted text from the image */
  text: string;

  /** Overall confidence score (0.0 to 1.0) */
  confidence: number;

  /** Optional: detected language/script */
  language?: string;

  /** Optional: per-word bounding boxes and confidence */
  boundingBoxes?: WordBoundingBox[];
}

/**
 * Bounding box for a word in the image.
 */
export interface WordBoundingBox {
  word: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Options for OCR extraction.
 */
export interface OcrOptions {
  /** Language hints to improve accuracy (e.g., ['hi', 'sa'] for Devanagari) */
  languageHints?: string[];

  /** Whether to detect and correct image orientation */
  detectOrientation?: boolean;
}

/**
 * Port interface for OCR engines.
 *
 * Abstracts text extraction from images. Implementations may use
 * Google Cloud Vision, Tesseract, or other OCR services.
 */
export interface OcrEngine {
  /**
   * Extract text from an image buffer.
   *
   * @param imageBuffer - Binary image data
   * @param options - OCR options (language hints, etc.)
   * @returns OCR result with extracted text and confidence
   */
  extractText(imageBuffer: Buffer, options?: OcrOptions): Promise<OcrResult>;
}
