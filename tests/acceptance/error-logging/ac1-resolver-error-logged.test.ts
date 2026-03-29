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
 * AC-1: GraphQL resolver errors are logged with full stack traces
 *
 * Given a GraphQL mutation is executed
 * When the resolver throws a domain error (OcrAuthenticationError)
 * Then the error is logged at ERROR level with a non-empty stack trace
 * And the log entry includes the GraphQL field path
 */
describe('AC-1: Resolver errors are logged with stack trace and path', () => {
  let server: ReturnType<typeof createTestServer>;

  beforeEach(() => {
    server = createTestServer();
    server.mocks.ocrEngine.setError(
      new OcrAuthenticationError('OCR authentication failed: invalid credentials')
    );
  });

  it('captures exactly one error log entry', async () => {
    await server.executeQuery({ query: TRANSLATE_FROM_IMAGE_MUTATION, variables: { image: TEST_IMAGE } });

    expect(server.spyLogger.errorCalls).toHaveLength(1);
  });

  it('logged error is an OcrAuthenticationError', async () => {
    await server.executeQuery({ query: TRANSLATE_FROM_IMAGE_MUTATION, variables: { image: TEST_IMAGE } });

    expect(server.spyLogger.lastError?.error).toBeInstanceOf(OcrAuthenticationError);
  });

  it('logged error has a non-empty stack trace', async () => {
    await server.executeQuery({ query: TRANSLATE_FROM_IMAGE_MUTATION, variables: { image: TEST_IMAGE } });

    const err = server.spyLogger.lastError?.error as Error;
    expect(err.stack).toBeTruthy();
  });

  it('log context includes the GraphQL field path', async () => {
    await server.executeQuery({ query: TRANSLATE_FROM_IMAGE_MUTATION, variables: { image: TEST_IMAGE } });

    expect(server.spyLogger.lastError?.context?.path).toBe('translateSutraFromImage');
  });
});
