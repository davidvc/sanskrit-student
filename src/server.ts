import { createSchema, createYoga } from 'graphql-yoga';
import { TranslationService } from './domain/translation-service';
import { LlmTranslationService } from './adapters/llm-translation-service';
import { NormalizingTranslationService } from './adapters/normalizing-translation-service';
import { LlmClient } from './domain/llm-client';
import { ClaudeLlmClient } from './adapters/claude-llm-client';
import { ScriptDetectorImpl } from './domain/script-detector';
import { ScriptNormalizerImpl } from './domain/script-normalizer';
import { SanscriptConverter } from './adapters/sanscript-converter';
import { OcrTranslationService } from './domain/ocr-translation-service';
import { OcrEngine } from './domain/ocr-engine';
import { ImageStorageStrategy } from './domain/image-storage-strategy';
import { ImageValidator } from './domain/image-validator';
import { ImageValidatorFactory } from './adapters/image-validator-factory';
import { MockOcrEngine } from './adapters/mock-ocr-engine';
import { InMemoryImageStorage } from './adapters/in-memory-image-storage';

/**
 * Configuration options for creating the GraphQL server.
 */
export interface ServerConfig {
  /** The translation service to use for resolving translation queries */
  translationService: TranslationService;

  /** Optional: OCR translation service for image uploads */
  ocrTranslationService?: OcrTranslationService;
}

/**
 * Creates the script normalizer with detector and converter.
 */
function createScriptNormalizer(): ScriptNormalizerImpl {
  const detector = new ScriptDetectorImpl();
  const converter = new SanscriptConverter();
  return new ScriptNormalizerImpl(detector, converter);
}

/**
 * Dependencies that can be injected into the server configuration.
 * Uses domain interfaces (ports) to allow different implementations.
 */
export interface ServerDependencies {
  llmClient: LlmClient;
  ocrEngine: OcrEngine;
  imageStorage: ImageStorageStrategy;
  imageValidator: ImageValidator;
}

/**
 * Factory for creating server configurations with dependency injection.
 *
 * This class is the composition root that wires dependencies together.
 * Production and test code provide different implementations of the
 * same domain interfaces.
 */
export class ServerConfigFactory {
  /**
   * Validates that required dependencies are provided.
   *
   * @param deps - Dependencies to validate
   * @throws Error if required dependencies are null or undefined
   */
  private validateDependencies(deps: ServerDependencies): void {
    if (!deps.llmClient) {
      throw new Error('llmClient dependency is required but was not provided');
    }

    if (!deps.ocrEngine) {
      throw new Error('ocrEngine dependency is required but was not provided');
    }

    if (!deps.imageStorage) {
      throw new Error('imageStorage dependency is required but was not provided');
    }

    if (!deps.imageValidator) {
      throw new Error('imageValidator dependency is required but was not provided');
    }
  }

  /**
   * Creates a ServerConfig using provided dependencies.
   *
   * @param deps - Dependencies to inject (production or test implementations)
   * @returns Configuration with wired services
   * @throws Error if required dependencies are missing
   */
  create(deps: ServerDependencies): ServerConfig {
    this.validateDependencies(deps);

    const baseService = new LlmTranslationService(deps.llmClient);
    const normalizer = createScriptNormalizer();
    const translationService = new NormalizingTranslationService(normalizer, baseService);

    // Create OCR translation service - all dependencies are required
    const ocrTranslationService = new OcrTranslationService(
      deps.ocrEngine,
      deps.imageStorage,
      translationService,
      deps.imageValidator
    );

    return { translationService, ocrTranslationService };
  }
}

/**
 * Convenience function that uses ServerConfigFactory internally.
 *
 * @param deps - Dependencies to inject (production or test implementations)
 * @returns Configuration with wired services
 * @throws Error if required dependencies are missing
 */
export function createConfig(deps: ServerDependencies): ServerConfig {
  const factory = new ServerConfigFactory();
  return factory.create(deps);
}

/**
 * Creates a ServerConfig for production.
 * This is the composition root for production - creates real dependencies.
 *
 * @returns Complete server configuration with all services (translation and OCR)
 */
export function createProductionConfig(): ServerConfig {
  const deps: ServerDependencies = {
    llmClient: new ClaudeLlmClient(),
    // TODO: Replace with production OCR implementation when available
    ocrEngine: new MockOcrEngine(),
    imageStorage: new InMemoryImageStorage(),
    imageValidator: ImageValidatorFactory.createComposite(),
  };
  return createConfig(deps);
}

/**
 * Creates the GraphQL yoga server with the Sanskrit translation schema.
 *
 * @param config - Server configuration with injected dependencies
 * @returns The configured GraphQL yoga server instance
 */
export function createServer(config: ServerConfig) {
  const { translationService, ocrTranslationService } = config;

  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      scalar Upload

      type Query {
        translateSutra(sutra: String!): TranslationResult
      }

      type Mutation {
        translateSutraFromImage(image: Upload!): OcrTranslationResult!
      }

      type TranslationResult {
        originalText: [String!]!
        iastText: [String!]!
        words: [WordEntry!]!
        alternativeTranslations: [String!]
      }

      type OcrTranslationResult {
        originalText: [String!]!
        iastText: [String!]!
        words: [WordEntry!]!
        alternativeTranslations: [String!]
        ocrConfidence: Float!
        extractedText: String!
        ocrWarnings: [String!]
      }

      type WordEntry {
        word: String!
        meanings: [String!]!
      }
    `,
    resolvers: {
      Query: {
        translateSutra: async (_parent: unknown, args: { sutra: string }) => {
          return translationService.translate(args.sutra);
        },
      },
      Mutation: {
        translateSutraFromImage: async (_parent: unknown, args: { image: any }) => {
          if (!ocrTranslationService) {
            throw new Error('OCR translation service not configured');
          }
          return ocrTranslationService.translateFromImage(args.image);
        },
      },
    },
  });

  return createYoga({
    schema,
    maskedErrors: false, // Expose error messages to clients
  });
}
