import pino from 'pino';
import { PinoLogger } from './pino-logger';

/**
 * Factory for creating environment-aware PinoLogger instances.
 *
 * Development: pino-pretty for human-readable, colorised output.
 * Production: plain JSON to stdout (compatible with any log aggregator).
 */
export class PinoLoggerFactory {
  static create(isDevelopment = process.env.NODE_ENV !== 'production'): PinoLogger {
    const transportTarget = isDevelopment ? 'pino-pretty' : undefined;
    const transport = transportTarget
      ? { target: transportTarget, options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined;

    return new PinoLogger(pino({ level: 'info', transport }), transportTarget);
  }
}
