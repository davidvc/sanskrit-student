import { OcrEngine, OcrResult, OcrOptions } from '../domain/ocr-engine';

/**
 * Mock OCR engine for testing.
 *
 * Returns predefined OCR results without calling external APIs.
 * Useful for fast, deterministic acceptance tests.
 */
export class MockOcrEngine implements OcrEngine {
  private responses: Map<string, OcrResult> = new Map();
  private defaultResponse: OcrResult = {
    text: 'सत्यमेव जयते',
    confidence: 0.96,
    language: 'sa',
  };

  /**
   * Set a specific response for testing.
   *
   * @param response - OCR result to return
   */
  setResponse(response: OcrResult): void {
    this.defaultResponse = response;
  }

  /**
   * Set response based on expected text (for multiple test scenarios).
   *
   * @param expectedText - Text to match
   * @param response - OCR result to return
   */
  setResponseFor(expectedText: string, response: OcrResult): void {
    this.responses.set(expectedText, response);
  }

  /**
   * Extract text - returns mocked response.
   */
  async extractText(imageBuffer: Buffer, options?: OcrOptions): Promise<OcrResult> {
    // For testing, just return the configured response
    return this.defaultResponse;
  }
}
