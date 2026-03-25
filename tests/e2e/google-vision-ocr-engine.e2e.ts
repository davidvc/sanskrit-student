import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { GoogleVisionOcrEngine } from '../../src/adapters/google-vision-ocr-engine';
import { OcrAuthenticationError, OcrInvalidImageError } from '../../src/domain/ocr-errors';

const fixturesDir = join(__dirname, '../fixtures/images');

/**
 * End-to-end tests for the Google Cloud Vision OCR adapter.
 *
 * These tests call the live Vision API using Application Default Credentials.
 * Run with: npm run test:e2e
 */
describe('E2E: GoogleVisionOcrEngine', () => {
  const engine = new GoogleVisionOcrEngine();

  /**
   * TC1: Extract Devanagari text from a real image (happy path)
   *
   * Verifies the adapter is wired correctly end-to-end and the Vision API
   * returns usable OCR output for a clear Devanagari image.
   */
  it('TC1: extracts Devanagari text from a clear image', async () => {
    const imageBuffer = readFileSync(join(fixturesDir, 'clear-devanagari.png'));

    const result = await engine.extractText(imageBuffer, { languageHints: ['sa', 'hi'] });

    expect(result.text).not.toBe('');
    expect(result.text).toMatch(/[\u0900-\u097F]/);
    expect(result.confidence).toBeGreaterThanOrEqual(0.0);
    expect(result.confidence).toBeLessThanOrEqual(1.0);
  });

  /**
   * TC2: No text in image returns empty result
   *
   * Verifies the adapter handles a zero-annotation response without throwing,
   * returning a well-defined empty result.
   */
  it('TC2: returns empty result when image contains no text', async () => {
    const imageBuffer = readFileSync(join(fixturesDir, 'no-text.png'));

    const result = await engine.extractText(imageBuffer);

    expect(result.text).toBe('');
    expect(result.confidence).toBe(0.0);
  });

  /**
   * TC3: Invalid credentials throw OcrAuthenticationError
   *
   * Verifies the error mapping path for authentication failure.
   */
  it('TC3: throws OcrAuthenticationError for bad credentials', async () => {
    const badEngine = new GoogleVisionOcrEngine({
      credentials: { client_email: 'bad@fake.iam', private_key: 'not-a-key' },
    });

    await expect(badEngine.extractText(Buffer.from('any'))).rejects.toThrow(OcrAuthenticationError);
  });

  /**
   * TC4: Invalid image buffer returns empty result
   *
   * The live Vision API treats unrecognised binary content leniently —
   * it returns no annotations rather than rejecting the request.
   * The OcrInvalidImageError mapping for gRPC INVALID_ARGUMENT is verified
   * in the adapter tests using a stubbed client.
   */
  it('TC4: returns empty result for a corrupt image buffer', async () => {
    const invalidBuffer = readFileSync(join(fixturesDir, 'invalid.bin'));

    const result = await engine.extractText(invalidBuffer);

    expect(result.text).toBe('');
    expect(result.confidence).toBe(0.0);
  });
});
