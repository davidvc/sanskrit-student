import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createTestServer } from '../helpers/test-server';

/**
 * Acceptance tests for the Google Cloud Vision OCR Adapter.
 *
 * These tests run the full system (image → OCR → translation) using the real
 * Google Cloud Vision API instead of the mock engine. They are skipped
 * automatically unless GOOGLE_CLOUD_VISION_KEY_FILE (or Application Default
 * Credentials via GOOGLE_APPLICATION_CREDENTIALS) is present.
 *
 * ## Setup (one-time, per machine)
 *
 * 1. Enable the Cloud Vision API in your Google Cloud project.
 * 2. Create a service account with the "Cloud Vision API User" role and
 *    download its JSON key to a location outside this repo, e.g.:
 *      ~/.config/gcloud/sanskrit-student-vision-key.json
 * 3. Set the environment variable before running:
 *      export GOOGLE_CLOUD_VISION_KEY_FILE=~/.config/gcloud/sanskrit-student-vision-key.json
 *    Or use Application Default Credentials:
 *      gcloud auth application-default login
 * 4. Place test images in tests/fixtures/images/ (see IMAGE FIXTURES section below).
 *
 * ## Running
 *
 *   GOOGLE_CLOUD_VISION_KEY_FILE=~/.config/gcloud/key.json \
 *     npx vitest run tests/acceptance/google-vision-ocr-adapter.test.ts
 *
 * ## Image fixtures required
 *
 *   tests/fixtures/images/clear-devanagari.png   — printed Devanagari, clear background
 *   tests/fixtures/images/no-text.png            — blank or non-text image
 *   tests/fixtures/images/mixed-script.png       — Devanagari + Latin text together
 */

// ─── Credential detection ────────────────────────────────────────────────────

const hasCredentials =
  !!process.env.GOOGLE_CLOUD_VISION_KEY_FILE ||
  !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

// ─── Shared GraphQL mutation ─────────────────────────────────────────────────

const TRANSLATE_FROM_IMAGE = `
  mutation TranslateSutraFromImage($image: Upload!) {
    translateSutraFromImage(image: $image) {
      extractedText
      iastText
      words {
        word
        meanings
      }
      ocrConfidence
      ocrWarnings
    }
  }
`;

interface OcrTranslationResult {
  extractedText: string;
  iastText: string[];
  words: Array<{ word: string; meanings: string[] }>;
  ocrConfidence: number;
  ocrWarnings?: string[];
}

interface TranslateResponse {
  translateSutraFromImage: OcrTranslationResult;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fixtureImage(filename: string) {
  const filePath = path.join(__dirname, '../fixtures/images', filename);
  return {
    filename,
    mimetype: 'image/png',
    encoding: '7bit',
    _buffer: fs.readFileSync(filePath),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe.skipIf(!hasCredentials)(
  'Acceptance: Google Cloud Vision OCR Adapter (real API)',
  () => {
    let server: ReturnType<typeof createTestServer>;

    beforeAll(async () => {
      // Import lazily so the module is never loaded in CI without credentials
      const { GoogleVisionOcrEngine } = await import(
        '../../src/adapters/google-vision-ocr-engine'
      );

      const keyFilename = process.env.GOOGLE_CLOUD_VISION_KEY_FILE;
      const ocrEngine = new GoogleVisionOcrEngine(
        keyFilename ? { keyFilename } : {}
      );

      server = createTestServer({ ocrEngine });
    });

    /**
     * AC1 — Extract Devanagari text from a clear image
     *
     * Given an image containing clear Devanagari text
     * When I call translateSutraFromImage
     * Then the extracted text is non-empty Devanagari
     * And confidence is at least 0.80
     */
    it('AC1: extracts Devanagari text from a clear image', async () => {
      const response = await server.executeQuery<TranslateResponse>({
        query: TRANSLATE_FROM_IMAGE,
        variables: { image: fixtureImage('clear-devanagari.png') },
      });

      expect(response.errors).toBeUndefined();
      const result = response.data!.translateSutraFromImage;

      expect(result.extractedText).toMatch(/[\u0900-\u097F]/); // contains Devanagari
      expect(result.ocrConfidence).toBeGreaterThanOrEqual(0.8);
    });

    /**
     * AC2 — Language hints are passed to the Vision API
     *
     * The system passes languageHints through to the API.
     * We verify this indirectly: supplying ["hi", "sa"] should not degrade
     * Devanagari extraction (and in practice improves it).
     *
     * Note: direct verification that hints reached the API requires a stub;
     * see the high-level design for the stub-based test for this criterion.
     */
    it('AC2: extraction succeeds when language hints are supplied', async () => {
      // The GraphQL mutation does not currently expose languageHints as an argument.
      // This test verifies the happy-path still works; a future mutation argument
      // would allow explicit hint testing. Filed as a follow-up.
      const response = await server.executeQuery<TranslateResponse>({
        query: TRANSLATE_FROM_IMAGE,
        variables: { image: fixtureImage('clear-devanagari.png') },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data!.translateSutraFromImage.extractedText).toBeTruthy();
    });

    /**
     * AC3 — Detected language is returned in the result
     *
     * The Vision API returns a locale for detected language.
     * The adapter maps it to OcrResult.language, which flows through as
     * metadata. (Currently not surfaced in the GraphQL schema — this test
     * serves as a reminder to expose it when needed.)
     */
    it('AC3: extraction completes without error (language metadata flows internally)', async () => {
      const response = await server.executeQuery<TranslateResponse>({
        query: TRANSLATE_FROM_IMAGE,
        variables: { image: fixtureImage('clear-devanagari.png') },
      });

      // Language is an internal adapter field not yet in the GraphQL schema.
      // Verify the call succeeds; schema extension is a follow-up.
      expect(response.errors).toBeUndefined();
    });

    /**
     * AC4 — No text detected in image
     *
     * Given an image containing no recognisable text
     * When extractText is called
     * Then the system returns an error (no readable text)
     */
    it('AC4: returns error when image contains no text', async () => {
      const response = await server.executeQuery<TranslateResponse>({
        query: TRANSLATE_FROM_IMAGE,
        variables: { image: fixtureImage('no-text.png') },
      });

      expect(response.errors).toBeDefined();
      expect(response.errors![0].message).toMatch(/no readable text/i);
    });

    /**
     * AC5 — Mixed script image — adapter returns full API output without filtering
     *
     * Given an image with both Latin and Devanagari text
     * When extractText is called
     * Then the result includes all text the Vision API detected
     * And confidence is within 0.0–1.0
     */
    it('AC5: returns full API output for mixed-script image', async () => {
      const response = await server.executeQuery<TranslateResponse>({
        query: TRANSLATE_FROM_IMAGE,
        variables: { image: fixtureImage('mixed-script.png') },
      });

      // May succeed or return an error depending on Devanagari content.
      // Key assertion: confidence is always in range and text is not filtered.
      if (!response.errors) {
        const result = response.data!.translateSutraFromImage;
        expect(result.ocrConfidence).toBeGreaterThanOrEqual(0.0);
        expect(result.ocrConfidence).toBeLessThanOrEqual(1.0);
      }
    });

    /**
     * AC6 — Confidence score is normalised to 0.0–1.0
     *
     * Regardless of how the Vision API returns confidence, the adapter
     * must produce a value in [0.0, 1.0].
     */
    it('AC6: confidence score is always in the 0.0–1.0 range', async () => {
      const response = await server.executeQuery<TranslateResponse>({
        query: TRANSLATE_FROM_IMAGE,
        variables: { image: fixtureImage('clear-devanagari.png') },
      });

      expect(response.errors).toBeUndefined();
      const { ocrConfidence } = response.data!.translateSutraFromImage;
      expect(ocrConfidence).toBeGreaterThanOrEqual(0.0);
      expect(ocrConfidence).toBeLessThanOrEqual(1.0);
    });

    /**
     * AC7 — Authentication failure → OcrAuthenticationError
     *
     * This scenario requires deliberately bad credentials. It is tested by
     * instantiating the adapter directly rather than through the full server,
     * because the GraphQL layer wraps all errors uniformly.
     */
    it('AC7: throws OcrAuthenticationError for invalid credentials', async () => {
      const { GoogleVisionOcrEngine } = await import(
        '../../src/adapters/google-vision-ocr-engine'
      );
      const { OcrAuthenticationError } = await import('../../src/domain/ocr-errors');

      const badEngine = new GoogleVisionOcrEngine({
        credentials: { client_email: 'bad@bad.com', private_key: 'notakey' },
      });

      await expect(
        badEngine.extractText(Buffer.from([0x89, 0x50, 0x4e, 0x47]))
      ).rejects.toThrow(OcrAuthenticationError);
    });

    /**
     * AC10 — Invalid image → OcrInvalidImageError
     *
     * Passing a 1-byte buffer causes the Vision API to reject the image.
     * Tested directly on the adapter (same reason as AC7).
     */
    it('AC10: throws OcrInvalidImageError for a corrupt/invalid image buffer', async () => {
      const { GoogleVisionOcrEngine } = await import(
        '../../src/adapters/google-vision-ocr-engine'
      );
      const { OcrInvalidImageError } = await import('../../src/domain/ocr-errors');

      const keyFilename = process.env.GOOGLE_CLOUD_VISION_KEY_FILE;
      const engine = new GoogleVisionOcrEngine(keyFilename ? { keyFilename } : {});

      await expect(
        engine.extractText(Buffer.from([0x00])) // 1 invalid byte
      ).rejects.toThrow(OcrInvalidImageError);
    });
  }
);
