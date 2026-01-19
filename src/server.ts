import { createSchema, createYoga } from 'graphql-yoga';
import { TranslationService } from './domain/translation-service';
import { LlmTranslationService } from './adapters/llm-translation-service';
import { MockLlmClient } from './adapters/mock-llm-client';
import { ClaudeLlmClient } from './adapters/claude-llm-client';

/**
 * Configuration options for creating the GraphQL server.
 */
export interface ServerConfig {
  /** The translation service to use for resolving translation queries */
  translationService: TranslationService;
}

/**
 * Creates a ServerConfig using MockLlmClient for testing.
 *
 * @returns Configuration with mock translation service
 */
export function createTestConfig(): ServerConfig {
  const llmClient = new MockLlmClient();
  const translationService = new LlmTranslationService(llmClient);
  return { translationService };
}

/**
 * Creates a ServerConfig using ClaudeLlmClient for production.
 *
 * @returns Configuration with Claude-backed translation service
 */
export function createProductionConfig(): ServerConfig {
  const llmClient = new ClaudeLlmClient();
  const translationService = new LlmTranslationService(llmClient);
  return { translationService };
}

/**
 * Creates the GraphQL yoga server with the Sanskrit translation schema.
 *
 * @param config - Server configuration with injected dependencies
 * @returns The configured GraphQL yoga server instance
 */
export function createServer(config: ServerConfig) {
  const { translationService } = config;

  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        translateSutra(sutra: String!): TranslationResult
      }

      type TranslationResult {
        originalText: String!
        words: [WordEntry!]!
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
    },
  });

  return createYoga({ schema });
}
