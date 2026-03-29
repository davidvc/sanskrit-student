import { Plugin } from 'graphql-yoga';
import { Logger } from '../domain/logger';

/**
 * GraphQL Yoga plugin that logs every resolver error.
 *
 * Uses the onResultProcess hook so every error that would otherwise
 * be silently swallowed is captured with its full stack trace and
 * original error object (preserving cause chains).
 *
 * @param logger - Logger port to write error entries to
 */
export function createErrorLoggingPlugin(logger: Logger): Plugin {
  return {
    onResultProcess({ result }) {
      if ('errors' in result && result.errors) {
        for (const error of result.errors) {
          const original = error.originalError ?? error;
          logger.error('GraphQL error', original, {
            path: error.path?.join('.'),
            message: error.message,
          });
        }
      }
    },
  };
}
