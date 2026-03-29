import { describe, it, expect } from 'vitest';
import { createTestServer } from '../helpers/test-server';

/**
 * Bug regression: Android upload crashes with TypeError (mimetype undefined)
 *
 * On Android, React Native's File object has `name`/`type` properties but does
 * not expose a spec-compliant `arrayBuffer` method.  The `toFileUpload` adapter
 * in server.ts fell through to a bare cast which left `mimetype` undefined,
 * causing `upload.mimetype.toLowerCase()` to throw in OcrTranslationService.
 *
 * These tests verify that Android-style upload objects are normalised correctly
 * and never crash the server.
 */
describe('Bug: Android upload normalisation', () => {
  const server = createTestServer();

  const mutation = `
    mutation TranslateSutraFromImage($image: Upload!) {
      translateSutraFromImage(image: $image) {
        extractedText
        iastText
        ocrConfidence
      }
    }
  `;

  /**
   * An Android React Native File-like object uses `name`/`type` instead of
   * `filename`/`mimetype`.  The server must normalise this without crashing.
   */
  it('should handle Android-style file object (name/type instead of filename/mimetype)', async () => {
    // Arrange – simulate what React Native sends: `name` and `type`, no `mimetype`
    const androidFile = {
      name: 'photo.jpg',
      type: 'image/jpeg',
      encoding: 'binary',
      _buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]), // JPEG magic bytes
    };

    // Act
    const response = await server.executeQuery({
      query: mutation,
      variables: { image: androidFile },
    });

    // Assert – no TypeError crash; request is processed successfully
    expect(response.errors).toBeUndefined();
    expect(response.data).toBeDefined();
  });

  /**
   * Even if the mimetype from Android is somehow missing entirely, the server
   * should return a clean validation error rather than an unhandled TypeError.
   */
  it('should return a clean error when mimetype is undefined rather than crashing', async () => {
    // Arrange – object with no mimetype at all
    const malformedFile = {
      filename: 'photo.jpg',
      encoding: 'binary',
      _buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    };

    // Act
    const response = await server.executeQuery({
      query: mutation,
      variables: { image: malformedFile },
    });

    // Assert – GraphQL error (not a server crash / 500)
    expect(response.errors).toBeDefined();
    expect(response.errors![0].message).toMatch(/unsupported image format|missing.*mime|mime.*missing/i);
  });
});
