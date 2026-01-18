import { createServer, createTestConfig } from '../../src/server';

/**
 * Response type from GraphQL query execution.
 */
export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Query options for executing a GraphQL query.
 */
export interface QueryOptions {
  query: string;
  variables?: Record<string, unknown>;
}

/**
 * Test server wrapper that provides a convenient interface for executing
 * GraphQL queries in tests.
 */
export interface TestServer {
  executeQuery<T = unknown>(options: QueryOptions): Promise<GraphQLResponse<T>>;
}

/**
 * Creates a test server instance for acceptance testing.
 *
 * The server is configured with MockLlmClient via createTestConfig(),
 * providing stubbed responses for known Sanskrit sutras without
 * requiring external LLM dependencies.
 */
export function createTestServer(): TestServer {
  const config = createTestConfig();
  const yoga = createServer(config);

  return {
    async executeQuery<T = unknown>(options: QueryOptions): Promise<GraphQLResponse<T>> {
      const response = await yoga.fetch('http://localhost/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: options.query,
          variables: options.variables,
        }),
      });

      return response.json() as Promise<GraphQLResponse<T>>;
    },
  };
}
