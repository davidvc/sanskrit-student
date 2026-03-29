# Backend Error Logging Design

## Problem

Backend errors are being swallowed. Only the `message` string reaches the frontend
via GraphQL; full stack traces and error context are lost. There is no structured,
searchable log output during development or production.

## Goals

1. Every error that surfaces through GraphQL is logged server-side with its full stack trace.
2. Logs are structured (JSON) so they are machine-searchable in production.
3. In development the logs are human-readable (pretty-printed with colors).
4. The logger is a first-class dependency, injectable and swappable (hexagonal architecture).
5. Nested `cause` chains are preserved and logged.

## Non-goals

- Distributed tracing / APM (can be added later via a different adapter)
- Client-side logging
- Log aggregation service integration (Datadog, Logtail, etc.) — left for a follow-up

---

## Design

### 1. Logger Port

```typescript
// src/domain/logger.ts

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(msg: string, context?: Record<string, unknown>): void;
  info(msg: string, context?: Record<string, unknown>): void;
  warn(msg: string, context?: Record<string, unknown>): void;
  error(msg: string, error?: unknown, context?: Record<string, unknown>): void;
}
```

A minimal interface — three contextual loggers plus `error` which accepts the
raw thrown value so stack traces and `cause` chains are never lost.

---

### 2. Pino Adapter

**Why Pino?**

| Criterion | Choice |
|-----------|--------|
| Performance | Fastest structured logger for Node (async I/O) |
| Structured output | Native JSON — compatible with any log aggregator |
| Dev experience | `pino-pretty` for human-readable terminal output |
| Size | Small footprint, no heavy transitive deps |

```typescript
// src/adapters/pino-logger.ts

import pino, { Logger as PinoInstance } from 'pino';
import { Logger } from '../domain/logger';

export class PinoLogger implements Logger {
  private readonly pino: PinoInstance;

  constructor(pinoInstance: PinoInstance) {
    this.pino = pinoInstance;
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
```

`pino` serializes `err` automatically: type name, message, stack, and (via
`pino-std-serializers`) the full `cause` chain.

#### Factory

```typescript
// src/adapters/pino-logger-factory.ts

import pino from 'pino';
import { PinoLogger } from './pino-logger';

export class PinoLoggerFactory {
  static create(isDevelopment = process.env.NODE_ENV !== 'production'): PinoLogger {
    const transport = isDevelopment
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined;

    return new PinoLogger(pino({ level: 'info', transport }));
  }
}
```

In production the transport is omitted and pino writes raw JSON to stdout
(standard for container/serverless environments).

---

### 3. Hooking into GraphQL Yoga

GraphQL Yoga exposes an `onError` plugin lifecycle hook. We add a plugin that
logs every error that would otherwise silently disappear.

```typescript
// src/adapters/error-logging-plugin.ts

import { Plugin } from 'graphql-yoga';
import { Logger } from '../domain/logger';

export function createErrorLoggingPlugin(logger: Logger): Plugin {
  return {
    onResultProcess({ result }) {
      if ('errors' in result && result.errors) {
        for (const error of result.errors) {
          logger.error('GraphQL error', error.originalError ?? error, {
            path: error.path?.join('.'),
            message: error.message,
          });
        }
      }
    },
  };
}
```

`error.originalError` is the raw domain exception (with its `cause` and stack
trace). When there is no `originalError` (e.g. a schema validation error) we
fall back to the `GraphQLError` itself.

---

### 4. Wiring into Server

`Logger` becomes part of `ServerDependencies`:

```typescript
// src/server.ts (additions)

export interface ServerDependencies {
  llmClient: LlmClient;
  ocrEngine: OcrEngine;
  imageStorage: ImageStorageStrategy;
  imageValidator: ImageValidator;
  logger: Logger;                  // ← new
}
```

`createServer` receives the logger and attaches the plugin:

```typescript
export function createServer(config: ServerConfig) {
  const { translationService, ocrTranslationService, logger } = config;

  return createYoga({
    schema,
    plugins: [createErrorLoggingPlugin(logger)],
    maskedErrors: false,
  });
}
```

Production entry point (`src/index.ts` / `api/graphql.js`) creates the logger
via `PinoLoggerFactory.create()` and passes it through `createProductionConfig`.

Tests inject a `MockLogger` (a no-op or spy implementation of the `Logger`
interface) so tests don't produce noise and can assert on log calls if needed.

---

### 5. Unhandled Exceptions

`src/index.ts` already calls `console.error` on server startup failures. We
replace those and add process-level guards:

```typescript
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason instanceof Error ? reason : new Error(String(reason)));
});
```

---

### 6. Sample Log Output

**Development (`pino-pretty`):**
```
[2026-03-28 10:32:01.234] ERROR: GraphQL error
    path: "translateSutraFromImage"
    message: "OCR authentication failed"
    err: {
      "type": "OcrAuthenticationError",
      "message": "OCR authentication failed: invalid credentials",
      "stack": "OcrAuthenticationError: OCR authentication failed: invalid credentials\n    at GoogleVisionOcrEngine.mapGrpcError ...",
      "cause": {
        "message": "getting metadata from plugin failed",
        "stack": "Error: getting metadata from plugin failed\n    at ..."
      }
    }
```

**Production (JSON stdout):**
```json
{
  "level": 50,
  "time": 1743161521234,
  "msg": "GraphQL error",
  "path": "translateSutraFromImage",
  "message": "OCR authentication failed",
  "err": {
    "type": "OcrAuthenticationError",
    "message": "OCR authentication failed: invalid credentials",
    "stack": "OcrAuthenticationError: ...",
    "cause": { "message": "...", "stack": "..." }
  }
}
```

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/domain/logger.ts` | New — `Logger` port |
| `src/adapters/pino-logger.ts` | New — `PinoLogger` adapter |
| `src/adapters/pino-logger-factory.ts` | New — factory for dev/prod logger |
| `src/adapters/error-logging-plugin.ts` | New — GraphQL Yoga plugin |
| `src/server.ts` | Add `logger` to `ServerDependencies` and `ServerConfig`, wire plugin |
| `src/index.ts` | Use `PinoLoggerFactory`, replace console calls, add process handlers |
| `api/graphql.js` | Use `PinoLoggerFactory` |
| `package.json` | Add `pino` dep; add `pino-pretty` as dev dep |

---

## Dependencies

```json
{
  "dependencies": {
    "pino": "^9.x"
  },
  "devDependencies": {
    "pino-pretty": "^13.x"
  }
}
```

---

## Open Questions

1. **`maskedErrors` in production** — currently `false` (exposes stack in
   GraphQL response). This is fine for development but leaks internals in
   production. A follow-up can set `maskedErrors: true` in production and rely
   on server-side logs for details.

2. **Log level configuration** — should `LOG_LEVEL` env var override the
   default? Low-risk addition, can be done during implementation.

3. **Vercel / serverless** — Vercel captures stdout as logs. The JSON output
   will work correctly. `pino-pretty` should NOT be used in production serverless
   (perf overhead and structured log parsers expect JSON).
