import { describe, it, expect } from 'vitest';
import { PinoLoggerFactory } from '../../../src/adapters/pino-logger-factory';
import { PinoLogger } from '../../../src/adapters/pino-logger';

/**
 * AC-3: Development logs are human-readable
 * AC-4: Production logs are structured JSON
 *
 * Verifies PinoLoggerFactory.create() returns a PinoLogger configured
 * with the correct transport for each environment.
 */
describe('AC-3/AC-4: PinoLoggerFactory creates environment-appropriate logger', () => {
  it('returns a PinoLogger in development mode', () => {
    const logger = PinoLoggerFactory.create(true);
    expect(logger).toBeInstanceOf(PinoLogger);
  });

  it('returns a PinoLogger in production mode', () => {
    const logger = PinoLoggerFactory.create(false);
    expect(logger).toBeInstanceOf(PinoLogger);
  });

  it('dev logger uses pino-pretty transport', () => {
    const logger = PinoLoggerFactory.create(true);
    expect(logger.transportTarget).toBe('pino-pretty');
  });

  it('prod logger has no transport (writes plain JSON)', () => {
    const logger = PinoLoggerFactory.create(false);
    expect(logger.transportTarget).toBeUndefined();
  });
});
