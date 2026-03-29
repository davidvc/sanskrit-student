/**
 * Port: Logger
 *
 * Defines the logging contract for the application.
 * Implementations (adapters) are injected via ServerDependencies.
 */
export interface Logger {
  debug(msg: string, context?: Record<string, unknown>): void;
  info(msg: string, context?: Record<string, unknown>): void;
  warn(msg: string, context?: Record<string, unknown>): void;
  /** Logs at ERROR level. Accepts the raw thrown value to preserve stack traces and cause chains. */
  error(msg: string, error?: unknown, context?: Record<string, unknown>): void;
}
