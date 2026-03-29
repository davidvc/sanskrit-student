import pino, { Logger as PinoInstance } from 'pino';
import { Logger } from '../domain/logger';

/**
 * Adapter: PinoLogger
 *
 * Wraps a pino instance to satisfy the Logger port.
 * Passes the raw error object under the `err` key so pino's built-in
 * serialiser preserves the stack trace and cause chain.
 *
 * `transportTarget` records the pino transport target (if any) so that
 * tests can verify the factory selected the correct transport without
 * relying on pino internals.
 */
export class PinoLogger implements Logger {
  private readonly pino: PinoInstance;
  readonly transportTarget?: string;

  constructor(pinoInstance: PinoInstance, transportTarget?: string) {
    this.pino = pinoInstance;
    this.transportTarget = transportTarget;
  }

  debug(msg: string, context?: Record<string, unknown>): void {
    this.pino.debug(context ?? {}, msg);
  }

  info(msg: string, context?: Record<string, unknown>): void {
    this.pino.info(context ?? {}, msg);
  }

  warn(msg: string, context?: Record<string, unknown>): void {
    this.pino.warn(context ?? {}, msg);
  }

  error(msg: string, error?: unknown, context?: Record<string, unknown>): void {
    this.pino.error({ err: error, ...context }, msg);
  }
}
