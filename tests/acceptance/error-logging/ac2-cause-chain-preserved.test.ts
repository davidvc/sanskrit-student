import { describe, it, expect, beforeEach } from 'vitest';
import { createTestServer } from '../../helpers/test-server';
import { OcrAuthenticationError } from '../../../src/domain/ocr-errors';

const TRANSLATE_FROM_IMAGE_MUTATION = `
  mutation TranslateSutraFromImage($image: Upload!) {
    translateSutraFromImage(image: $image) {
      extractedText
      iastText
    }
  }
`;

const TEST_IMAGE = {
  filename: 'test.png',
  mimetype: 'image/png',
  encoding: '7bit',
  _buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
};

/**
 * AC-2: Nested cause chains are preserved in logs
 *
 * Given a domain error wraps an underlying cause
 * When the error is logged
 * Then the log entry includes the cause chain with message and stack trace
 */
describe('AC-2: Nested cause chains are preserved in logged errors', () => {
  let server: ReturnType<typeof createTestServer>;

  beforeEach(() => {
    server = createTestServer();
    server.mocks.ocrEngine.setError(
      new OcrAuthenticationError('auth failed', {
        cause: new Error('getting metadata from plugin failed'),
      })
    );
  });

  it('logged error has a cause property', async () => {
    await server.executeQuery({ query: TRANSLATE_FROM_IMAGE_MUTATION, variables: { image: TEST_IMAGE } });

    const err = server.spyLogger.lastError?.error as Error & { cause?: unknown };
    expect(err.cause).toBeDefined();
  });

  it('cause is an Error instance', async () => {
    await server.executeQuery({ query: TRANSLATE_FROM_IMAGE_MUTATION, variables: { image: TEST_IMAGE } });

    const err = server.spyLogger.lastError?.error as Error & { cause?: unknown };
    expect(err.cause).toBeInstanceOf(Error);
  });

  it('cause has the correct message', async () => {
    await server.executeQuery({ query: TRANSLATE_FROM_IMAGE_MUTATION, variables: { image: TEST_IMAGE } });

    const err = server.spyLogger.lastError?.error as Error & { cause?: Error };
    expect(err.cause?.message).toBe('getting metadata from plugin failed');
  });

  it('cause has a non-empty stack trace', async () => {
    await server.executeQuery({ query: TRANSLATE_FROM_IMAGE_MUTATION, variables: { image: TEST_IMAGE } });

    const err = server.spyLogger.lastError?.error as Error & { cause?: Error };
    expect(err.cause?.stack).toBeTruthy();
  });
});
