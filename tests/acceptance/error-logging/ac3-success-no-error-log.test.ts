import { describe, it, expect } from 'vitest';
import { createTestServer } from '../../helpers/test-server';

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
 * AC-7: Non-error GraphQL responses produce no error log output
 *
 * Given a GraphQL mutation is executed
 * When the resolver returns a successful result
 * Then no ERROR-level log entries are written
 */
describe('AC-7: Successful operations produce no error log entries', () => {
  it('produces no error log entries on a successful mutation', async () => {
    const server = createTestServer();
    // No error configured — MockOcrEngine returns default successful result

    const response = await server.executeQuery({
      query: TRANSLATE_FROM_IMAGE_MUTATION,
      variables: { image: TEST_IMAGE },
    });

    expect(response.errors).toBeUndefined();
    expect(server.spyLogger.errorCalls).toHaveLength(0);
  });
});
