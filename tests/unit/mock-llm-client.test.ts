import { describe, it, expect } from 'vitest';
import { MockLlmClient } from '../../src/adapters/mock-llm-client';
import { LlmClient } from '../../src/domain/llm-client';

describe('MockLlmClient', () => {
  it('should implement the LlmClient interface', () => {
    const client: LlmClient = new MockLlmClient();
    expect(client).toBeDefined();
    expect(typeof client.translateSutra).toBe('function');
  });

  describe('translateSutra', () => {
    describe('for known sutra "atha yoganuasanam"', () => {
      it('should return a stubbed response with word entries', async () => {
        const client = new MockLlmClient();
        const response = await client.translateSutra('atha yoganuasanam');

        expect(response.words).toBeInstanceOf(Array);
        expect(response.words.length).toBeGreaterThan(0);
      });

      it('should include entry for "atha" with correct grammatical form', async () => {
        const client = new MockLlmClient();
        const response = await client.translateSutra('atha yoganuasanam');

        const athaEntry = response.words.find((w) => w.word === 'atha');
        expect(athaEntry).toBeDefined();
        expect(athaEntry!.grammaticalForm).toBe('indeclinable particle');
        expect(athaEntry!.meanings).toContain('now');
        expect(athaEntry!.meanings).toContain('here begins');
      });

      it('should include entry for "yoganuasanam" with compound analysis', async () => {
        const client = new MockLlmClient();
        const response = await client.translateSutra('atha yoganuasanam');

        const yogaEntry = response.words.find((w) => w.word === 'yoganuasanam');
        expect(yogaEntry).toBeDefined();
        expect(yogaEntry!.grammaticalForm).toBe(
          'compound noun, nominative, singular, neuter'
        );
        expect(yogaEntry!.meanings.length).toBeGreaterThan(0);
      });
    });

    describe('for unknown sutras', () => {
      it('should return a generic valid response', async () => {
        const client = new MockLlmClient();
        const response = await client.translateSutra('some unknown sutra text');

        expect(response.words).toBeInstanceOf(Array);
        expect(response.words.length).toBeGreaterThan(0);
      });

      it('should include word entries with all required fields', async () => {
        const client = new MockLlmClient();
        const response = await client.translateSutra('dharma');

        for (const wordEntry of response.words) {
          expect(wordEntry.word).toBeDefined();
          expect(typeof wordEntry.word).toBe('string');
          expect(wordEntry.word.length).toBeGreaterThan(0);

          expect(wordEntry.grammaticalForm).toBeDefined();
          expect(typeof wordEntry.grammaticalForm).toBe('string');
          expect(wordEntry.grammaticalForm.length).toBeGreaterThan(0);

          expect(wordEntry.meanings).toBeInstanceOf(Array);
          expect(wordEntry.meanings.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
