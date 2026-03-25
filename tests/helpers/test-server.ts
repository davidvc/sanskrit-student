import { createServer, createConfig } from '../../src/server';
import { MockLlmClient } from '../../src/adapters/mock-llm-client';
import { MockOcrEngine } from '../../src/adapters/mock-ocr-engine';
import { InMemoryImageStorage } from '../../src/adapters/in-memory-image-storage';
import { ImageValidatorFactory } from '../../src/adapters/image-validator-factory';
import { ImageValidator } from '../../src/domain/image-validator';
import { OcrEngine } from '../../src/domain/ocr-engine';

/**
 * Test-specific dependencies that can be configured by tests.
 * These are concrete mock implementations, not exposed to production code.
 */
export interface TestMocks {
  llmClient: MockLlmClient;
  ocrEngine: MockOcrEngine;
  imageStorage: InMemoryImageStorage;
  imageValidator: ImageValidator;
}

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
 * GraphQL queries in tests and accessing mock dependencies.
 */
export interface TestServer {
  executeQuery<T = unknown>(options: QueryOptions): Promise<GraphQLResponse<T>>;
  mocks: TestMocks;
}

/**
 * Options for creating a test server with custom dependencies.
 */
export interface TestServerOptions {
  /** Override the OCR engine. Defaults to MockOcrEngine. */
  ocrEngine?: OcrEngine;
}

/**
 * Creates a test server instance for acceptance testing.
 *
 * This is the composition root for tests. Mock dependencies are created here
 * and passed to createConfig() for wiring. The mock instances are exposed
 * via the TestServer interface, allowing tests to configure them without
 * instanceof coupling.
 *
 * Pass `ocrEngine` to substitute a real engine (e.g. GoogleVisionOcrEngine)
 * while keeping all other dependencies mocked.
 *
 * @param options - Optional overrides for specific dependencies
 * @returns Test server with mock dependencies accessible via .mocks
 */
export function createTestServer(options: TestServerOptions = {}): TestServer {
  // Create all mock dependencies (composition root for tests)
  const mocks: TestMocks = {
    llmClient: new MockLlmClient(),
    ocrEngine: new MockOcrEngine(),
    imageStorage: new InMemoryImageStorage(),
    imageValidator: ImageValidatorFactory.createComposite(),
  };

  const deps = {
    ...mocks,
    ...(options.ocrEngine ? { ocrEngine: options.ocrEngine } : {}),
  };

  // Wire dependencies through createConfig (same composition logic as production)
  const config = createConfig(deps);
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
    mocks,
  };
}
