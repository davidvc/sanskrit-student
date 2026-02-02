import { describe, it, expect } from 'vitest';
import { ServerConfigFactory } from '../../src/server';
import { MockLlmClient } from '../../src/adapters/mock-llm-client';
import { MockOcrEngine } from '../../src/adapters/mock-ocr-engine';
import { InMemoryImageStorage } from '../../src/adapters/in-memory-image-storage';
import { ImageValidatorFactory } from '../../src/adapters/image-validator-factory';

/**
 * ServerConfigFactory validation tests.
 *
 * Verifies that the factory properly validates required dependencies
 * and throws errors when dependencies are missing or incomplete.
 */
describe('ServerConfigFactory', () => {
  const factory = new ServerConfigFactory();

  describe('Dependency Validation', () => {
    it('should throw error when llmClient is null', () => {
      expect(() => {
        factory.create({ llmClient: null as any });
      }).toThrow('llmClient dependency is required but was not provided');
    });

    it('should throw error when llmClient is undefined', () => {
      expect(() => {
        factory.create({ llmClient: undefined as any });
      }).toThrow('llmClient dependency is required but was not provided');
    });

    it('should throw error when ocrEngine is missing', () => {
      expect(() => {
        factory.create({
          llmClient: new MockLlmClient(),
          ocrEngine: null as any,
          imageStorage: new InMemoryImageStorage(),
          imageValidator: ImageValidatorFactory.createComposite(),
        });
      }).toThrow('ocrEngine dependency is required but was not provided');
    });

    it('should throw error when imageStorage is missing', () => {
      expect(() => {
        factory.create({
          llmClient: new MockLlmClient(),
          ocrEngine: new MockOcrEngine(),
          imageStorage: null as any,
          imageValidator: ImageValidatorFactory.createComposite(),
        });
      }).toThrow('imageStorage dependency is required but was not provided');
    });

    it('should throw error when imageValidator is missing', () => {
      expect(() => {
        factory.create({
          llmClient: new MockLlmClient(),
          ocrEngine: new MockOcrEngine(),
          imageStorage: new InMemoryImageStorage(),
          imageValidator: null as any,
        });
      }).toThrow('imageValidator dependency is required but was not provided');
    });

    it('should create config successfully with all dependencies', () => {
      const config = factory.create({
        llmClient: new MockLlmClient(),
        ocrEngine: new MockOcrEngine(),
        imageStorage: new InMemoryImageStorage(),
        imageValidator: ImageValidatorFactory.createComposite(),
      });

      expect(config).toBeDefined();
      expect(config.translationService).toBeDefined();
      expect(config.ocrTranslationService).toBeDefined();
    });
  });
});
