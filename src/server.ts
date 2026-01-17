import { createSchema, createYoga } from 'graphql-yoga';

/**
 * Creates the GraphQL yoga server with the Sanskrit translation schema.
 */
export function createServer() {
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
        grammaticalForm: String!
        meanings: [String!]!
      }
    `,
    resolvers: {
      Query: {
        translateSutra: () => {
          // TODO: Implement translation service
          throw new Error('Not implemented');
        },
      },
    },
  });

  return createYoga({ schema });
}
