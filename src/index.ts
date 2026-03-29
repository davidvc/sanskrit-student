import 'dotenv/config';
import { createServer as createNodeServer } from 'node:http';
import { createServer, createProductionConfig, createConfig, ServerDependencies } from './server';
import { MockLlmClient } from './adapters/mock-llm-client';
import { MockOcrEngine } from './adapters/mock-ocr-engine';
import { InMemoryImageStorage } from './adapters/in-memory-image-storage';
import { ImageValidatorFactory } from './adapters/image-validator-factory';
import { VercelGcpAuthClientProvider } from './adapters/vercel-gcp-auth';
import { DefaultGcpAuthClientProvider } from './adapters/gcp-auth-client-provider';
import { PinoLoggerFactory } from './adapters/pino-logger-factory';

const DEFAULT_PORT = 4000;

// Export for serverless function (Vercel)
export { createServer, createProductionConfig, createConfig, ServerDependencies };

async function main() {
  const logger = PinoLoggerFactory.create();

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error(
      'Unhandled promise rejection',
      reason instanceof Error ? reason : new Error(String(reason))
    );
    process.exit(1);
  });

  const useMock = process.argv.includes('--mock') || !process.env.ANTHROPIC_API_KEY;

  let config;
  if (useMock) {
    console.log('⚠️  Running in MOCK mode (no API key required)');
    const deps: ServerDependencies = {
      llmClient: new MockLlmClient(),
      ocrEngine: new MockOcrEngine(),
      imageStorage: new InMemoryImageStorage(),
      imageValidator: ImageValidatorFactory.createComposite(),
      logger,
    };
    config = createConfig(deps);
  } else {
    const authProvider = process.env.VERCEL
      ? new VercelGcpAuthClientProvider()
      : new DefaultGcpAuthClientProvider();
    config = await createProductionConfig(authProvider, logger);
  }

  const yoga = createServer(config);

  const nodeServer = createNodeServer(yoga);
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;

  nodeServer.listen(port, () => {
    console.log(`🚀 GraphQL server running at http://localhost:${port}/graphql`);
  });
}

// Only run main() when executed directly (not when imported)
if (require.main === module) {
  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
