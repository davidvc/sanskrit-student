import { Logger } from '../../src/domain/logger';

export interface ErrorCall {
  msg: string;
  error: unknown;
  context?: Record<string, unknown>;
}

/**
 * Test double for the Logger port.
 *
 * Records every call so tests can assert on logged data without
 * producing real output or depending on Pino internals.
 */
export class SpyLogger implements Logger {
  readonly errorCalls: ErrorCall[] = [];
  readonly warnCalls: Array<{ msg: string; context?: Record<string, unknown> }> = [];

  debug(_msg: string): void {}
  info(_msg: string): void {}

  warn(msg: string, context?: Record<string, unknown>): void {
    this.warnCalls.push({ msg, context });
  }

  error(msg: string, error?: unknown, context?: Record<string, unknown>): void {
    this.errorCalls.push({ msg, error, context });
  }

  get lastError(): ErrorCall | undefined {
    return this.errorCalls.at(-1);
  }
}
